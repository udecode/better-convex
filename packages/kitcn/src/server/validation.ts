/**
 * Shared Zod validation reporting for the Convex procedure and HTTP route
 * builders.
 */
import type { Value } from 'convex/values';
import type * as z from 'zod';
import { CRPCError } from './error';

const DYNAMIC_OUTPUT_PATH_SEGMENT = '<dynamic>';

type OutputPathSchema = z.ZodTypeAny & {
  _zod: {
    def: {
      element?: z.ZodTypeAny;
      getter?: () => z.ZodTypeAny;
      in?: z.ZodTypeAny;
      innerType?: z.ZodTypeAny;
      items?: z.ZodTypeAny[];
      options?: z.ZodTypeAny[];
      out?: z.ZodTypeAny;
      rest?: z.ZodTypeAny | null;
      shape?: Record<string, z.ZodTypeAny>;
      type: string;
      valueType?: z.ZodTypeAny;
    };
  };
};

/**
 * Convert Zod issues into a Convex `Value` payload.
 *
 * `JSON.stringify` throws on a bigint, and an issue describing an `int64` bound
 * carries one (`z.bigint().min(5n)` reports `minimum: 5n`). Stringifying those
 * keeps the reported error about the schema mismatch instead of replacing it
 * with a serialization failure.
 */
export function zodIssuesToConvexValue(
  issues: readonly z.core.$ZodIssue[]
): Value[] {
  return JSON.parse(
    JSON.stringify(issues, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  ) as Value[];
}

/**
 * Keep output-validation diagnostics useful without forwarding handler data.
 *
 * Zod's built-in issues omit the rejected value, but a schema-defined
 * refinement can copy it into `message` or arbitrary custom fields. Output
 * validation is a server fault, so client data is restricted to structural
 * fields. The complete `ZodError` remains available as the error cause for
 * server logs.
 */
function expandOutputPathSchemas(
  schemas: readonly z.ZodTypeAny[]
): OutputPathSchema[] {
  const pending = schemas.map((schema) => schema as OutputPathSchema);
  const expanded: OutputPathSchema[] = [];
  const seen = new Set<OutputPathSchema>();

  while (pending.length > 0) {
    const schema = pending.pop();
    if (!schema || seen.has(schema)) continue;
    seen.add(schema);
    const definition = schema._zod.def;
    if (
      [
        'catch',
        'default',
        'nonoptional',
        'nullable',
        'optional',
        'readonly',
      ].includes(definition.type) &&
      definition.innerType
    ) {
      pending.push(definition.innerType as OutputPathSchema);
    } else if (definition.type === 'lazy' && definition.getter) {
      pending.push(definition.getter() as OutputPathSchema);
    } else if (definition.type === 'pipe' && definition.in && definition.out) {
      pending.push(
        definition.in as OutputPathSchema,
        definition.out as OutputPathSchema
      );
    } else if (definition.type === 'union' && definition.options) {
      pending.push(...(definition.options as OutputPathSchema[]));
    } else {
      expanded.push(schema);
    }
  }

  return expanded;
}

function sanitizeOutputIssuePath(
  schema: z.ZodTypeAny,
  path: readonly PropertyKey[]
): Value[] {
  let candidates = expandOutputPathSchemas([schema]);

  return path.map((segment) => {
    const nextCandidates: z.ZodTypeAny[] = [];
    let isDeclaredObjectField =
      typeof segment === 'string' && candidates.length > 0;

    for (const candidate of candidates) {
      const definition = candidate._zod.def;
      const declaredField =
        definition.type === 'object' &&
        typeof segment === 'string' &&
        definition.shape?.[segment];
      if (declaredField) {
        nextCandidates.push(declaredField);
        continue;
      }

      isDeclaredObjectField = false;
      if (definition.type === 'record' && definition.valueType) {
        nextCandidates.push(definition.valueType);
      } else if (definition.type === 'array' && definition.element) {
        nextCandidates.push(definition.element);
      } else if (definition.type === 'tuple' && typeof segment === 'number') {
        const tupleChild = definition.items?.[segment] ?? definition.rest;
        if (tupleChild) nextCandidates.push(tupleChild);
      }
    }

    candidates = expandOutputPathSchemas(nextCandidates);
    return typeof segment === 'string' && isDeclaredObjectField
      ? segment
      : DYNAMIC_OUTPUT_PATH_SEGMENT;
  });
}

function outputZodIssuesToConvexValue(
  schema: z.ZodTypeAny,
  issues: readonly z.core.$ZodIssue[]
): Value[] {
  return issues.map((issue) => {
    const safeIssue: Record<string, Value> = {
      code: issue.code,
      path: sanitizeOutputIssuePath(schema, issue.path),
    };
    if (
      issue.code === 'invalid_type' &&
      'expected' in issue &&
      typeof issue.expected === 'string'
    ) {
      safeIssue.expected = issue.expected;
    }
    return safeIssue;
  });
}

/**
 * Parse a handler's return value through its `.output()` schema.
 *
 * The value is parsed exactly as the handler produced it - `undefined` is not
 * normalized to `null` first, so a nullable schema needs an explicit `null`.
 *
 * A raw `ZodError` carries no `Symbol.for('ConvexError')`, so Convex strips its
 * message and `data` and hands the client an opaque `Server Error`, and the HTTP
 * router falls back to a generic 500. Wrapping it keeps the mismatch
 * self-diagnosing: Convex forwards `data` to the client, and `handleHttpError`
 * logs the whole error server-side rather than putting it in the response body.
 * The code is `INTERNAL_SERVER_ERROR` because a value the handler returned is a
 * server fault, not a client one, and it preserves the 500 the HTTP path already
 * returned. Client data retains only structural issue fields; custom messages
 * and fields can embed the rejected server value, so the complete Zod error is
 * kept in `cause` for server logs instead of forwarded.
 *
 * Only the parse is wrapped: a `ZodError` a handler threw itself keeps its
 * identity and travels through the caller's own error handling untouched.
 */
export async function parseOutput(
  schema: z.ZodTypeAny,
  value: unknown
): Promise<unknown> {
  const result = await schema.safeParseAsync(value);
  if (result.success) return result.data;

  throw new CRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Output validation failed',
    cause: result.error,
    data: {
      ZodError: outputZodIssuesToConvexValue(schema, result.error.issues),
    },
  });
}
