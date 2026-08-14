import type {
  AnyMiddleware,
  GetRawInputFn,
  MiddlewareNext,
  MiddlewareProcedureInfo,
  MiddlewareResult,
} from './types';

export type MiddlewareExecutionResult = MiddlewareResult<unknown> & {
  input: unknown;
  output?: unknown;
};

type MiddlewareResolver = (opts: {
  ctx: unknown;
  input: unknown;
}) => Promise<unknown>;

/** Run middleware around a terminal procedure resolver. */
export const executeMiddlewares = async (
  middlewares: AnyMiddleware[],
  ctx: unknown,
  meta: unknown,
  procedure: MiddlewareProcedureInfo,
  input: unknown,
  getRawInput: GetRawInputFn,
  resolve: MiddlewareResolver,
  index = 0
): Promise<MiddlewareExecutionResult> => {
  if (index >= middlewares.length) {
    return {
      marker: undefined as never,
      ctx,
      input,
      output: await resolve({ ctx, input }),
    };
  }

  const middleware = middlewares[index];
  let currentInput = input;
  let innerResult: MiddlewareExecutionResult | undefined;

  const next: MiddlewareNext<any, any> = async <
    TNextContext extends object = Record<string, never>,
  >(opts?: {
    ctx?: TNextContext;
    input?: unknown;
  }) => {
    const nextCtx = opts?.ctx ?? ctx;
    if (opts?.input !== undefined) {
      currentInput = opts.input;
    }
    innerResult = await executeMiddlewares(
      middlewares,
      nextCtx,
      meta,
      procedure,
      currentInput,
      getRawInput,
      resolve,
      index + 1
    );
    return innerResult as MiddlewareResult<any>;
  };

  const result = (await middleware({
    ctx: ctx as any,
    meta,
    procedure,
    input,
    getRawInput,
    next,
  })) as MiddlewareExecutionResult;

  return {
    marker: undefined as never,
    ctx: result.ctx ?? ctx,
    input: result.input ?? innerResult?.input ?? currentInput,
    output: result.output ?? innerResult?.output,
  };
};
