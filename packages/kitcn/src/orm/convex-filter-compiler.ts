/**
 * The single owner of `FilterExpression` -> Convex `.filter()` translation.
 *
 * Both the read path (`GelRelationalQuery._toConvexExpression`) and the write
 * path (`update()` / `delete()` through `toConvexFilter`) compile the same
 * expression tree, so the translation lives here once. It used to be copied
 * per lane, and the copies drifted: the same `inArray` nesting bug had to be
 * found twice, and the lanes still disagree about temporal normalization and
 * about whether `isNull` matches an absent field. Those remaining differences
 * are now explicit `ConvexFilterCompilerOptions` instead of two silent forks.
 */

import type {
  BinaryExpression,
  ExpressionVisitor,
  FilterExpression,
  LogicalExpression,
  UnaryExpression,
} from './filter-expression';
import { isFieldReference } from './filter-expression';

/**
 * Operators Convex's `.filter()` cannot express, so they compile to a
 * `() => true` placeholder and the real predicate runs in JavaScript after the
 * rows are read. Callers that push a compiled expression into Convex must
 * first check `isConvexEnforceableFilter`: a `true` placeholder makes a
 * downstream `take()` spend its budget on unfiltered rows, and a surrounding
 * `NOT` turns it into `q.not(true)`, which matches nothing.
 */
export const POST_FETCH_ONLY_OPERATORS: ReadonlySet<string> = new Set([
  'like',
  'ilike',
  'notLike',
  'notIlike',
  'startsWith',
  'endsWith',
  'contains',
  'arrayContains',
  'arrayContained',
  'arrayOverlaps',
]);

/**
 * Compared against `_id`, which is a Convex id and can never equal a plain
 * string, so `eq` against it is unsatisfiable. Convex's expression grammar has
 * no literal boolean, so this is how `in []` says "match nothing".
 */
const NEVER_MATCH_SENTINEL = '__better_convex_never__';

export interface ConvexFilterCompilerOptions {
  /**
   * Coerces a comparison operand to its stored representation, e.g. a `Date`
   * to the epoch milliseconds a `timestamp()` column actually holds. Applied
   * to `inArray`/`notInArray` element-wise by the caller's normalizer.
   */
  normalizeValue?: (fieldName: string, value: unknown) => unknown;
  /**
   * Whether `isNull` also matches a field that was never written. Convex
   * stores an omitted column as a missing field, which reads back as
   * `undefined` rather than `null`.
   */
  nullMatchesUndefined?: boolean;
}

/**
 * Convex's `q.or` / `q.and` are variadic — `or(...exprs)` serializes to a flat
 * `{ $or: [...] }` (see `convex/src/server/impl/filter_builder_impl.ts`).
 * Folding them pairwise instead nests one `$or` per operand, so the serialized
 * filter's JSON depth grows as `2N + 1` and the backend rejects the whole query
 * with `Received invalid json: recursion limit exceeded` once the list passes a
 * few dozen entries. Always combine in one variadic call.
 */
export function convexOr(q: any, expressions: any[]): any {
  return expressions.length === 1 ? expressions[0] : q.or(...expressions);
}

/** Flat `$and` counterpart of {@link convexOr}. */
export function convexAnd(q: any, expressions: any[]): any {
  return expressions.length === 1 ? expressions[0] : q.and(...expressions);
}

/**
 * Whether Convex can carry the whole expression in `.filter()`, or some part of
 * it compiles to a `() => true` placeholder that only JavaScript can enforce.
 */
export function isConvexEnforceableFilter(
  filter: FilterExpression<boolean>
): boolean {
  if (filter.type === 'binary') {
    return !POST_FETCH_ONLY_OPERATORS.has(filter.operator);
  }
  if (filter.type === 'unary') {
    const [operand] = filter.operands;
    if (isFieldReference(operand)) {
      return true;
    }
    return isConvexEnforceableFilter(operand as FilterExpression<boolean>);
  }
  if (filter.type === 'logical') {
    return filter.operands.every((operand) =>
      isConvexEnforceableFilter(operand)
    );
  }
  return true;
}

/**
 * Compile a filter expression to a Convex `.filter()` callback.
 *
 * @param expression - Filter expression tree
 * @param options - Per-lane semantics; see {@link ConvexFilterCompilerOptions}
 */
export function compileConvexFilter(
  expression: FilterExpression<boolean>,
  options: ConvexFilterCompilerOptions = {}
): (q: any) => any {
  const { normalizeValue, nullMatchesUndefined = false } = options;

  const visitor: ExpressionVisitor<(q: any) => any> = {
    visitBinary: (expr: BinaryExpression) => {
      const [field, value] = expr.operands;
      if (!isFieldReference(field)) {
        throw new Error(
          'Binary expression must have FieldReference as first operand'
        );
      }

      const fieldName = field.fieldName;
      const normalizedValue = normalizeValue
        ? normalizeValue(fieldName, value)
        : value;

      switch (expr.operator) {
        case 'eq':
          return (q: any) => q.eq(q.field(fieldName), normalizedValue);
        case 'ne':
          return (q: any) => q.neq(q.field(fieldName), normalizedValue);
        case 'gt':
          return (q: any) => q.gt(q.field(fieldName), normalizedValue);
        case 'gte':
          return (q: any) => q.gte(q.field(fieldName), normalizedValue);
        case 'lt':
          return (q: any) => q.lt(q.field(fieldName), normalizedValue);
        case 'lte':
          return (q: any) => q.lte(q.field(fieldName), normalizedValue);
        case 'inArray': {
          // inArray: field must be in the provided array
          const values = normalizedValue as any[];
          return (q: any) => {
            if (values.length === 0) {
              return q.eq(q.field('_id'), NEVER_MATCH_SENTINEL);
            }
            return convexOr(
              q,
              values.map((v) => q.eq(q.field(fieldName), v))
            );
          };
        }
        case 'notInArray': {
          // notInArray: field must NOT be in the provided array. `notInArray()`
          // rejects an empty list at construction, so there is no empty case.
          const values = normalizedValue as any[];
          return (q: any) =>
            convexAnd(
              q,
              values.map((v) => q.neq(q.field(fieldName), v))
            );
        }
        case 'like':
        case 'ilike':
        case 'notLike':
        case 'notIlike':
        case 'startsWith':
        case 'endsWith':
        case 'contains':
        case 'arrayContains':
        case 'arrayContained':
        case 'arrayOverlaps':
          // Handled by the caller's post-fetch pass; see
          // POST_FETCH_ONLY_OPERATORS.
          return () => true;
        default:
          throw new Error(`Unsupported binary operator: ${expr.operator}`);
      }
    },

    visitLogical: (expr: LogicalExpression) => {
      const operandFns = expr.operands.map((op) => op.accept(visitor));

      if (expr.operator === 'and') {
        return (q: any) =>
          convexAnd(
            q,
            operandFns.map((fn) => fn(q))
          );
      }
      if (expr.operator === 'or') {
        return (q: any) =>
          convexOr(
            q,
            operandFns.map((fn) => fn(q))
          );
      }

      throw new Error(`Unsupported logical operator: ${expr.operator}`);
    },

    visitUnary: (expr: UnaryExpression) => {
      const operand = expr.operands[0];

      if (expr.operator === 'not') {
        const operandFn = (operand as FilterExpression<boolean>).accept(
          visitor
        );
        return (q: any) => q.not(operandFn(q));
      }

      if (expr.operator === 'isNull') {
        if (!isFieldReference(operand)) {
          throw new Error('isNull must operate on a field reference');
        }
        const fieldName = operand.fieldName;
        if (!nullMatchesUndefined) {
          return (q: any) => q.eq(q.field(fieldName), null);
        }
        return (q: any) =>
          q.or(
            q.eq(q.field(fieldName), null),
            q.eq(q.field(fieldName), undefined)
          );
      }

      if (expr.operator === 'isNotNull') {
        if (!isFieldReference(operand)) {
          throw new Error('isNotNull must operate on a field reference');
        }
        const fieldName = operand.fieldName;
        if (!nullMatchesUndefined) {
          return (q: any) => q.neq(q.field(fieldName), null);
        }
        return (q: any) =>
          q.and(
            q.neq(q.field(fieldName), null),
            q.neq(q.field(fieldName), undefined)
          );
      }

      throw new Error(`Unsupported unary operator: ${expr.operator}`);
    },
  };

  return expression.accept(visitor);
}
