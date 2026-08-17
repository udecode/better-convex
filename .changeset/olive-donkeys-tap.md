---
"kitcn": patch
---

## Patches

- Fix `.output()` validation failures reaching the client as an opaque
  `Server Error`. They now throw a `CRPCError` with code
  `INTERNAL_SERVER_ERROR`, message `Output validation failed`, and the Zod issues
  in `error.data.ZodError`, so a handler returning the wrong shape names itself.
  `.paginated()` is covered too.

```ts
// A handler that returns the wrong shape
c.query.output(z.object({ ok: z.boolean() })).query(async () => ({ ok: "yes" }));

// Client
error.data.ZodError;
// [{ expected: 'boolean', code: 'invalid_type', path: ['ok'], message: '...' }]
```

- Log server faults from HTTP routes. A route that fails its `.output()` schema
  still answers `500` with only a code and message, but the full error now
  reaches the server log instead of being discarded.

- Ship `CHANGELOG.md` in the published package.

- Document the `.output()` return contract: the handler returns the schema's
  input type, an `undefined` return is parsed as-is rather than substituted with
  `null`, and an absent value is modelled as `.nullable()` rather than a
  top-level `.optional()`, which Convex's returns validator cannot express.
