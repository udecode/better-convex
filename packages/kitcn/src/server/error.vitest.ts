/**
 * Regression tests for cRPC errors surviving the Convex backend boundary.
 *
 * These live in the vitest lane on purpose: the failure mode is V8-specific.
 * `bun test` runs on JavaScriptCore, which materializes `prepareStackTrace`
 * eagerly and therefore cannot observe the bug.
 *
 * The backend contract being modelled (from the Convex runtime):
 * 1. `Error.prepareStackTrace` is overridden to write `__frameData` onto the
 *    error as a side effect. V8 runs it lazily on the *first* read of `.stack`.
 * 2. `serializeConvexErrorData` JSON-encodes `data` and tags the error with
 *    `ConvexErrorSymbol` when `Symbol.for('ConvexError')` is present.
 * 3. The backend reads `.stack` (to trigger the hook), then *requires*
 *    `__frameData` before it will look at `ConvexErrorSymbol`/`data`. Missing
 *    `__frameData` aborts source mapping, and the error reaches the client as a
 *    bare `Error` with the message redacted and no `.data`.
 *
 * Assigning `.stack` satisfies step 3's read without ever running step 1's
 * hook, which silently drops every cRPC payload.
 */
import { ConvexError, convexToJson, jsonToConvex } from 'convex/values';
import { afterEach, expect, test } from 'vitest';

import { CRPCError, getCRPCErrorFromUnknown, toCRPCError } from './error';

const originalPrepareStackTrace = Error.prepareStackTrace;

afterEach(() => {
  Error.prepareStackTrace = originalPrepareStackTrace;
});

function installConvexStackHook(): void {
  Error.prepareStackTrace = (error, frames) => {
    Object.defineProperties(error, {
      __frameData: {
        configurable: true,
        value: JSON.stringify(
          frames.map((frame) => ({
            fileName: frame.getFileName(),
            lineNumber: frame.getLineNumber(),
          }))
        ),
      },
    });
    return 'formatted stack';
  };
}

type ClientError =
  | { data: Record<string, unknown>; kind: 'ConvexError' }
  | { kind: 'Error' };

/**
 * Runs a thrown value through the same two steps the Convex backend does and
 * reports what the browser would end up with.
 */
function throwThroughConvex(thrown: unknown): ClientError {
  installConvexStackHook();

  const serialized = thrown as Record<string, unknown>;
  if (
    typeof thrown === 'object' &&
    thrown !== null &&
    Symbol.for('ConvexError') in thrown
  ) {
    serialized.data = JSON.stringify(
      convexToJson(
        serialized.data === undefined ? null : (serialized.data as any)
      )
    );
    serialized.ConvexErrorSymbol = Symbol.for('ConvexError');
  }

  if (!(thrown instanceof Error)) return { kind: 'Error' };

  // The backend reads `.stack` purely so `prepareStackTrace` populates
  // `__frameData`, then bails out when it is missing.
  void thrown.stack;
  if (serialized.__frameData === undefined) return { kind: 'Error' };

  const symbol = serialized.ConvexErrorSymbol as symbol | undefined;
  if (!symbol || serialized[symbol] !== true) return { kind: 'Error' };

  return {
    data: jsonToConvex(JSON.parse(serialized.data as string)) as Record<
      string,
      unknown
    >,
    kind: 'ConvexError',
  };
}

/** `ctx.runQuery`/`runMutation`/`runAction` rebuild a plain `ConvexError`. */
function acrossConvexSyscall(error: CRPCError): ConvexError<any> {
  const rethrown = new ConvexError(error.message);
  rethrown.data = JSON.parse(JSON.stringify(error.data));
  return rethrown;
}

test('a CRPCError thrown directly keeps its payload', () => {
  const result = throwThroughConvex(
    new CRPCError({ code: 'NOT_FOUND', message: 'Todo not found' })
  );

  expect(result).toEqual({
    data: { code: 'NOT_FOUND', message: 'Todo not found' },
    kind: 'ConvexError',
  });
});

test('a CRPCError rebuilt from a caller-to-caller ConvexError keeps its payload', () => {
  const fromInnerProcedure = acrossConvexSyscall(
    new CRPCError({
      code: 'BAD_REQUEST',
      data: { processorCode: 5120 },
      message: 'Declined: INSUFFICIENT_FUNDS',
    })
  );

  const result = throwThroughConvex(toCRPCError(fromInnerProcedure));

  expect(result).toEqual({
    data: {
      code: 'BAD_REQUEST',
      message: 'Declined: INSUFFICIENT_FUNDS',
      processorCode: 5120,
    },
    kind: 'ConvexError',
  });
});

test('a CRPCError converted from an OrmNotFoundError keeps its payload', () => {
  const cause = new Error('User not found');
  cause.name = 'OrmNotFoundError';

  expect(throwThroughConvex(toCRPCError(cause))).toEqual({
    data: { code: 'NOT_FOUND', message: 'User not found' },
    kind: 'ConvexError',
  });
});

test('a CRPCError converted from an APIError keeps its payload', () => {
  class FakeAPIError extends Error {
    body = { message: 'Nope' };
    status = 'UNAUTHORIZED';
    statusCode = 401;
    constructor() {
      super('Nope');
      this.name = 'APIError';
    }
  }

  expect(throwThroughConvex(toCRPCError(new FakeAPIError()))).toEqual({
    data: { code: 'UNAUTHORIZED', message: 'Nope' },
    kind: 'ConvexError',
  });
});

test('a CRPCError wrapped by getCRPCErrorFromUnknown keeps its payload', () => {
  expect(
    throwThroughConvex(getCRPCErrorFromUnknown(new Error('boom')))
  ).toEqual({
    data: { code: 'INTERNAL_SERVER_ERROR', message: 'boom' },
    kind: 'ConvexError',
  });
});

test('the harness detects a reintroduced `.stack` assignment', () => {
  const err = new CRPCError({ code: 'NOT_FOUND', message: 'Todo not found' });
  err.stack = 'copied from the cause';

  expect(throwThroughConvex(err)).toEqual({ kind: 'Error' });
});

test('converted errors expose the original stack through `cause`', () => {
  const cause = new Error('nope');
  cause.stack = 'ORIGINAL STACK';

  const err = getCRPCErrorFromUnknown(cause);

  expect(err.cause?.stack).toBe('ORIGINAL STACK');
  expect(err.stack).not.toBe('ORIGINAL STACK');
});
