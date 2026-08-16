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

## Features

- `zCustomQuery`, `zCustomMutation` and `zCustomAction` accept
  `skipZodReturnsValidation`, so `returns` can declare the Convex validator and
  the return type without also parsing the response in JS. The handler is then
  typed as the schema's output, since that value reaches Convex unchanged.

```ts
zCustomQuery(query, customCtx(withUser))({
  args: { id: z.string() },
  returns: z.object({ name: z.string() }),
  skipZodReturnsValidation: true,
  handler,
});
```

- Wire codecs accept `objectsOnly`, declaring that `isType` never claims a
  primitive. `serialize` then skips codec dispatch on primitive values.

```ts
const mapCodec: WireCodec = {
  tag: '$map',
  objectsOnly: true,
  isType: (value) => value instanceof Map,
  encode: (value) => [...value],
  decode: (value) => new Map(value),
};
```

## Patches

- Cut one full traversal of every response with an `.output()` or
  `.paginated()` declaration.
- Reuse the argument schema and its parse cache across requests instead of
  rebuilding them on every procedure call.
- Resolve the multi-`.input()` merge plan when the procedure is defined.
  Declaring a key that `.paginated()` also declares no longer clones a schema
  on every request.
- Skip codec dispatch on primitive values while encoding the built-in `Date`
  payloads, and stop walking a payload twice per direction when a transformer
  is passed to a server-side caller.
- Resolve HTTP `searchParams` coercion per route instead of per request, and
  read the query string in a single pass.
- Convert an `.input()` shape to its Convex validator once per procedure
  instead of three times.
