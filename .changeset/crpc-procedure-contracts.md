---
"kitcn": minor
---

## Breaking changes

- `next()` now resolves after the handler runs, so middleware wraps the whole
  procedure. Timing, error reporting, and cleanup around `next()` now observe
  the handler, and handler errors propagate through every wrapping `catch`. A
  `ctx` changed on the return path no longer reaches the handler — pass it to
  `next()` instead.

  ```ts
  // Before — logged 0ms, never saw handler errors, and this ctx was ignored
  .use(async ({ ctx, next }) => {
    const start = Date.now();
    const result = await next({ ctx });
    console.log(`${Date.now() - start}ms`);
    return { ...result, ctx: { ...ctx, tenant } };
  })

  // After — times the handler, sees its errors, and passes ctx forward
  .use(async ({ ctx, next }) => {
    const start = Date.now();
    try {
      return await next({ ctx: { ...ctx, tenant } });
    } finally {
      console.log(`${Date.now() - start}ms`);
    }
  })
  ```

- Chained `.input()` schemas are each applied on their own instead of being
  flattened into one shape, so object-level rules now run. A key declared by
  more than one schema is validated only by the last schema to declare it.

  ```ts
  // Before — the object-level rule was dropped and both fields reached the handler
  .input(z.object({ password: z.string(), confirm: z.string() }))

  // After — mismatched values are rejected before the handler runs
  .input(
    z
      .object({ password: z.string(), confirm: z.string() })
      .refine((v) => v.password === v.confirm)
  )
  ```

## Patches

- Fix `.input()` schemas running twice per request, which made field transforms
  apply to their own output — `z.string().transform(s => s.length)` threw on
  valid input and `z.number().transform(n => n * 2)` doubled twice. Transforms
  and refinements now run exactly once.
- Fix `next({ input })` being dropped for every middleware after the first, so
  input enrichment placed after an auth middleware no longer silently no-ops.
- Fix HTTP routes returning a retryable `500` for errors raised by a procedure
  they called through a caller. `NOT_FOUND`, `FORBIDDEN`, and other codes now
  keep their status and message.
- Fix HTTP routes returning `500` for the twelve error codes missing from the
  route status map, including `PAYLOAD_TOO_LARGE` (`413`),
  `UNSUPPORTED_MEDIA_TYPE` (`415`), and `PRECONDITION_FAILED` (`412`).
- Fix a malformed or empty JSON body returning `500` instead of `400`.
