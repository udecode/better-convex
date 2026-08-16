import type { GenericValidator } from 'convex/values';
import type { CONVEX_VALIDATOR_KINDS } from '../src/internal/upstream/validators';

type Equal<Left, Right> =
  (<Type>() => Type extends Left ? 1 : 2) extends <Type>() => Type extends Right
    ? 1
    : 2
    ? true
    : false;
type Expect<Type extends true> = Type;

type SupportedValidatorKind = (typeof CONVEX_VALIDATOR_KINDS)[number];
type _AllConvexValidatorKindsAreMapped = Expect<
  Equal<GenericValidator['kind'], SupportedValidatorKind>
>;
