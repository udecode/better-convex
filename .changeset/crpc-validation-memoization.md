---
"kitcn": minor
---

## Breaking changes

- `.output()` is now validated once, against the value your handler returned,
  instead of against its wire encoding. Schemas that transform a value into a
  `Date` (or into any type a custom wire codec owns) now encode correctly
  instead of being rejected, and `.output()` schemas using async refinements
  work.

```ts
const at = c.query
  .output(z.object({ at: z.string().transform((s) => new Date(s)) }))
  .query(async () => ({ at: '2024-01-01T00:00:00.000Z' }));

// Before: the schema ran after encoding, so the Date left the server raw
// After:  { at: { __crpc: 1, t: '$date', v: 1704067200000 } }
```

- `zCustomQuery`, `zCustomMutation` and `zCustomAction` treat `returns` as the
  declaration of the Convex returns validator and of the return type. The
  Convex backend enforces it; the Zod schema is no longer re-run in JS. Use
  `.output()` on a cRPC procedure, or parse in your handler, when you want a
  Zod parse.

```ts
// Before — the schema was parsed again in JS on every response
zCustomQuery(query, customCtx(withUser))({
  args: { id: z.string() },
  returns: z.object({ name: z.string() }),
  handler,
});

// After — parse it yourself if you need Zod semantics on the response
zCustomQuery(query, customCtx(withUser))({
  args: { id: z.string() },
  returns: z.object({ name: z.string() }),
  handler: async (ctx, args) => Result.parse(await handler(ctx, args)),
});
```

## Patches

- Cut one full traversal of every response with an `.output()` or
  `.paginated()` declaration.
- Reuse the argument schema and its parse cache across requests instead of
  rebuilding them on every procedure call.
- Resolve the multi-`.input()` merge plan when the procedure is defined.
  Declaring a key that `.paginated()` also declares no longer clones a schema
  on every request.
- Skip codec dispatch on primitive values while encoding payloads, and stop
  walking a payload twice per direction when a transformer is passed to a
  server-side caller.
- Resolve HTTP `searchParams` coercion per route instead of per request, and
  read the query string in a single pass.
- Convert an `.input()` shape to its Convex validator once per procedure
  instead of three times.
