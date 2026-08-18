/**
 * Shared Zod validation reporting for the Convex procedure and HTTP route
 * builders.
 */
import type { Value } from 'convex/values';
import type * as z from 'zod';
import { CRPCError } from './error';

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
function outputZodIssuesToConvexValue(
  issues: readonly z.core.$ZodIssue[]
): Value[] {
  return issues.map((issue) => {
    const safeIssue: Record<string, Value> = {
      code: issue.code,
      path: issue.path.map((segment) =>
        typeof segment === 'symbol' ? String(segment) : segment
      ),
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
    data: { ZodError: outputZodIssuesToConvexValue(result.error.issues) },
  });
}
