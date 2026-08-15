---
"kitcn": patch
---

## Patches

- Fix `CRPCError` reaching the client as a bare `Error` with the message
  redacted to `Server Error` and `error.data` undefined. Errors converted by
  cRPC — a procedure calling another procedure through a caller, an ORM
  not-found, a Better Auth `APIError`, or any error wrapped by
  `getCRPCErrorFromUnknown` — now arrive as a `ConvexError` carrying the
  original `code`, `message`, and custom `data`.

  ```ts
  // convex/functions/payment.ts — internal procedure
  throw new CRPCError({
    code: 'BAD_REQUEST',
    message: 'Declined: INSUFFICIENT_FUNDS',
    data: { processorCode },
  });

  // Before — the public procedure delegating to it lost the reason
  onError: (error) => {
    error.data; // undefined
  };

  // After
  onError: (error) => {
    error.data; // { code: 'BAD_REQUEST', message: 'Declined: …', processorCode }
  };
  ```

- Fix converted errors losing every source-mapped frame in Convex dashboard
  logs. Traces carry frames again; the original throw site stays on
  `error.cause`.
