/**
 * Custom Column Builder
 *
 * Wraps an arbitrary Convex validator so you can use object/array validators
 * as ORM columns with full TypeScript inference.
 *
 * @example
 * custom(v.object({ key: v.string() })).notNull()
 */

import type { Validator, Value } from 'convex/values';
import { v } from 'convex/values';
import { vRequired } from '../../internal/upstream/validators';
import type { ColumnBuilder } from './column-builder';
import {
  type ColumnBuilderBaseConfig,
  ConvexColumnBuilder,
  entityKind,
} from './convex-column-builder';

export interface ConvexValidatorLike {
  readonly fieldPaths: string;
  readonly isConvexValidator: true;
  readonly isOptional: 'optional' | 'required';
  readonly kind: string;
  readonly type: unknown;
}
type AnyColumnBuilder = ColumnBuilder<any, any, any>;
interface NestedShapeInput {
  [key: string]: NestedInput;
}
type NestedInput = ConvexValidatorLike | AnyColumnBuilder | NestedShapeInput;

type InferBuilderNestedValue<TBuilder extends AnyColumnBuilder> =
  TBuilder['_'] extends {
    $type: infer TType;
  }
    ? TType
    : TBuilder['_'] extends { data: infer TData }
      ? TBuilder['_'] extends { notNull: true }
        ? TData
        : TData | null
      : never;

type InferValidatorNestedValue<TValidator extends ConvexValidatorLike> =
  Exclude<TValidator['type'], undefined>;

type InferNestedValue<TInput extends NestedInput> =
  TInput extends AnyColumnBuilder
    ? InferBuilderNestedValue<TInput>
    : TInput extends ConvexValidatorLike
      ? InferValidatorNestedValue<TInput>
      : TInput extends NestedShapeInput
        ? InferObjectShape<TInput>
        : never;

type InferObjectShape<TShape extends NestedShapeInput> = {
  [K in keyof TShape]: InferNestedValue<TShape[K]>;
};

type InferObjectValue<TInput extends NestedInput> = TInput extends
  | AnyColumnBuilder
  | ConvexValidatorLike
  ? Record<string, InferNestedValue<TInput>>
  : TInput extends NestedShapeInput
    ? InferObjectShape<TInput>
    : never;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidator(value: unknown): value is ConvexValidatorLike {
  return (
    isRecord(value) &&
    typeof value.kind === 'string' &&
    typeof value.isOptional === 'string'
  );
}

function isColumnBuilder(value: unknown): value is AnyColumnBuilder {
  return isRecord(value) && (value as any)[entityKind] === 'ColumnBuilder';
}

function toRequiredValidator(
  validator: ConvexValidatorLike
): ConvexValidatorLike {
  return validator.isOptional === 'optional'
    ? (vRequired(validator as any) as ConvexValidatorLike)
    : validator;
}

function toRequiredBuilderValidator(
  validator: ConvexValidatorLike
): ConvexValidatorLike {
  const requiredValidator = toRequiredValidator(validator);

  if (requiredValidator.kind !== 'union') {
    return requiredValidator;
  }

  const nonNullMembers = (
    requiredValidator as ConvexValidatorLike & {
      members: ConvexValidatorLike[];
    }
  ).members.filter((member) => member.kind !== 'null');

  if (nonNullMembers.length !== 1) {
    return requiredValidator;
  }

  const [member] = nonNullMembers;
  if (member.kind === 'object' || member.kind === 'array') {
    return member as ConvexValidatorLike;
  }

  return requiredValidator;
}

function formatInvalidInput(path: string, value: unknown): string {
  const valueType = Array.isArray(value)
    ? 'array'
    : value === null
      ? 'null'
      : typeof value;
  return `${path} expected a column builder, Convex validator, or nested object shape. Got ${valueType}.`;
}

function objectShapeToValidator(
  shape: NestedShapeInput,
  path: string
): ConvexValidatorLike {
  const fields: Record<string, ConvexValidatorLike> = {};
  for (const [key, value] of Object.entries(shape)) {
    fields[key] = nestedInputToValidator(
      value as NestedInput,
      `${path}.${key}`
    );
  }
  return v.object(fields as Record<string, Validator<any, any, any>>);
}

function nestedInputToValidator(
  input: NestedInput,
  path: string
): ConvexValidatorLike {
  if (isColumnBuilder(input)) {
    return toRequiredBuilderValidator(
      (input as any).convexValidator as ConvexValidatorLike
    );
  }

  if (isValidator(input)) {
    return toRequiredValidator(input);
  }

  if (isRecord(input)) {
    return objectShapeToValidator(input as NestedShapeInput, path);
  }

  throw new Error(formatInvalidInput(path, input));
}

export type ConvexCustomBuilderInitial<
  TName extends string,
  TValidator extends ConvexValidatorLike,
> = ConvexCustomBuilder<
  {
    name: TName;
    dataType: 'any';
    columnType: 'ConvexCustom';
    data: TValidator['type'];
    driverParam: TValidator['type'];
    enumValues: undefined;
  },
  TValidator
>;

export class ConvexCustomBuilder<
  T extends ColumnBuilderBaseConfig<'any', 'ConvexCustom'>,
  TValidator extends ConvexValidatorLike,
> extends ConvexColumnBuilder<T, { validator: TValidator }> {
  static override readonly [entityKind]: string = 'ConvexCustomBuilder';

  constructor(name: T['name'], validator: TValidator) {
    super(name, 'any', 'ConvexCustom');
    this.config.validator = validator;
  }

  get convexValidator(): Validator<any, any, any> {
    const validator = this.config.validator;
    if (this.config.notNull) {
      return validator as unknown as Validator<any, any, any>;
    }
    return v.optional(
      v.union(v.null(), validator as unknown as Validator<any, 'required', any>)
    );
  }

  override build(): Validator<any, any, any> {
    return this.convexValidator;
  }
}

export function custom<TValidator extends ConvexValidatorLike>(
  validator: TValidator
): ConvexCustomBuilderInitial<'', TValidator>;
export function custom<
  TName extends string,
  TValidator extends ConvexValidatorLike,
>(
  name: TName,
  validator: TValidator
): ConvexCustomBuilderInitial<TName, TValidator>;
export function custom(
  a: string | ConvexValidatorLike,
  b?: ConvexValidatorLike
) {
  if (b !== undefined) {
    return new ConvexCustomBuilder(a as string, b);
  }
  return new ConvexCustomBuilder('', a as ConvexValidatorLike);
}

/**
 * Creates an array column from a nested validator or builder.
 *
 * Values in nested arrays are always compiled as required validators.
 */
export function arrayOf<TElement extends NestedInput>(element: TElement) {
  const validator = v.array(
    nestedInputToValidator(element, 'arrayOf(element)') as Validator<
      any,
      'required',
      any
    >
  );
  return custom(validator).$type<InferNestedValue<TElement>[]>();
}

/**
 * Creates a union column from validators/builders without dropping to `v.union(...)`.
 */
export function unionOf<
  const TMembers extends readonly [NestedInput, NestedInput, ...NestedInput[]],
>(...members: TMembers) {
  const validators = members.map((member, index) =>
    nestedInputToValidator(member, `unionOf(members[${index}])`)
  );
  return custom(
    v.union(
      ...(validators as [
        Validator<any, 'required', any>,
        Validator<any, 'required', any>,
        ...Validator<any, 'required', any>[],
      ])
    )
  ).$type<InferNestedValue<TMembers[number]>>();
}

/**
 * Creates an object column from either:
 * - a nested shape of validators/builders, or
 * - a validator/builder describing homogeneous record values
 *
 * Fields in nested objects are always compiled as required validators.
 */
export function objectOf<TInput extends NestedInput>(input: TInput) {
  if (isColumnBuilder(input) || isValidator(input)) {
    return custom(
      v.record(
        v.string(),
        nestedInputToValidator(input, 'objectOf(value)') as Validator<
          any,
          'required',
          any
        >
      )
    ).$type<InferObjectValue<TInput>>();
  }

  if (!isRecord(input)) {
    throw new Error(formatInvalidInput('objectOf(shape)', input));
  }

  const validator = objectShapeToValidator(
    input as NestedShapeInput,
    'objectOf(shape)'
  );
  return custom(validator).$type<InferObjectValue<TInput>>();
}

/**
 * Convenience wrapper for Convex "JSON" values.
 *
 * Note: This is Convex JSON (runtime `v.any()`), not SQL JSON/JSONB.
 */
export function json<T = Value>() {
  return custom(v.any()).$type<T>();
}
