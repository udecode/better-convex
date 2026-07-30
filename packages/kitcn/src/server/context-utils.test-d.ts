import type {
  FunctionReference,
  GenericDataModel,
  GenericMutationCtx,
} from 'convex/server';
import { expectTypeOf, test } from 'vitest';
import type { RunMutationCtx } from './context-utils';

type TestMutation = FunctionReference<
  'mutation',
  'internal',
  { value: string },
  null
>;

const checkCommonRunMutationCalls = (
  ctx: RunMutationCtx<GenericDataModel>,
  mutation: TestMutation
) => {
  void ctx.runMutation(mutation, { value: 'accepted' });

  void ctx.runMutation(
    mutation,
    { value: 'rejected' },
    // @ts-expect-error transaction limits are unavailable from action contexts
    { transactionLimits: { documentsRead: 1 } }
  );
};

const checkMutationRunMutationOptions = (
  ctx: GenericMutationCtx<GenericDataModel>,
  mutation: TestMutation
) => {
  void ctx.runMutation(
    mutation,
    { value: 'accepted' },
    { transactionLimits: { documentsRead: 1 } }
  );
};

test('runMutation uses the call shape shared by mutation and action contexts', () => {
  expectTypeOf<
    RunMutationCtx<GenericDataModel>['runMutation']
  >().toBeFunction();
  expectTypeOf(checkCommonRunMutationCalls).toBeFunction();
  expectTypeOf(checkMutationRunMutationOptions).toBeFunction();
});
