# HTTP Router

Typed REST APIs with cRPC HTTP router, Hono integration, webhooks, streaming, and client integration. Route builder basics → SKILL.md Section 9.

Prerequisites: `setup/server.md`.

## Setup

### Route Builders

```ts
// convex/lib/crpc.ts
import { CRPCError, initCRPC } from "kitcn/server";

const c = initCRPC.dataModel<DataModel>().context({}).create({});

export const publicRoute = c.httpAction;

export const authRoute = c.httpAction.use(async ({ ctx, next }) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new CRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, userId: identity.subject } });
});

export const router = c.router;
```

### HTTP Registration with Hono

Use `kitcn/auth/http` for auth route helpers; it auto-installs the Convex-safe `MessageChannel` polyfill.

```ts
// convex/functions/http.ts
import { authMiddleware } from "kitcn/auth/http";
import { createHttpRouter } from "kitcn/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { router } from "../lib/crpc";
import { getAuth } from "./generated/auth";
import { todosRouter } from "../routers/todos";
import { health } from "../routers/health";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: process.env.SITE_URL!,
    allowHeaders: ["Content-Type", "Authorization", "Better-Auth-Cookie"],
    exposeHeaders: ["Set-Better-Auth-Cookie"],
    credentials: true,
  })
);

app.use(authMiddleware(getAuth));

export const httpRouter = router({
  health,
  todos: todosRouter,
});

export default createHttpRouter(app, httpRouter);
```

| Component                           | Purpose                                    |
| ----------------------------------- | ------------------------------------------ |
| `Hono`                              | Route handling, middleware, CORS           |
| `authMiddleware(getAuth)`           | Better Auth routes middleware              |
| `createHttpRouter(app, httpRouter)` | Creates Convex HttpRouter with Hono + cRPC |

## Defining Routes

### GET with Search Params

```ts
import { createTodosCaller } from "../functions/generated/todos.runtime";

export const list = publicRoute
  .get("/api/todos")
  .searchParams(
    z.object({
      limit: z.coerce.number().optional().default(10),
      offset: z.coerce.number().optional().default(0),
    })
  )
  .output(z.array(todoSchema))
  .query(async ({ ctx, searchParams }) => {
    const caller = createTodosCaller(ctx);
    return caller.list({
      limit: searchParams.limit,
      offset: searchParams.offset,
    });
  });
```

Use `z.coerce.number()` for search params since URL query strings are always strings.

### GET with Path Params

```ts
export const get = publicRoute
  .get("/api/todos/:id")
  .params(z.object({ id: z.string() }))
  .output(todoSchema.nullable())
  .query(async ({ ctx, params }) => {
    const caller = createTodosCaller(ctx);
    return caller.get({ id: params.id });
  });
```

### POST / PATCH / DELETE

```ts
export const create = authRoute
  .post("/api/todos")
  .input(
    z.object({ title: z.string().min(1), description: z.string().optional() })
  )
  .output(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const caller = createTodoInternalCaller(ctx);
    const id = await caller.create({ userId: ctx.userId, ...input });
    return { id };
  });

export const update = authRoute
  .patch("/api/todos/:id")
  .params(z.object({ id: z.string() }))
  .input(
    z.object({
      title: z.string().optional(),
      completed: z.boolean().optional(),
    })
  )
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ ctx, params, input }) => {
    const caller = createTodoInternalCaller(ctx);
    await caller.update({ id: params.id, ...input });
    return { success: true };
  });

export const deleteTodo = authRoute
  .delete("/api/todos/:id")
  .params(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ ctx, params }) => {
    const caller = createTodoInternalCaller(ctx);
    await caller.deleteTodo({ id: params.id });
    return { success: true };
  });
```

### Routers

```ts
// convex/routers/todos.ts
export const todosRouter = router({
  list,
  get,
  create,
  update,
  delete: deleteTodo,
});
```

### Combined Schemas

```ts
export const createTask = authRoute
  .post("/api/projects/:projectId/tasks")
  .params(z.object({ projectId: z.string() }))
  .searchParams(z.object({ notify: z.coerce.boolean().optional() }))
  .input(z.object({ title: z.string(), description: z.string().optional() }))
  .output(z.object({ taskId: z.string(), projectId: z.string() }))
  .mutation(async ({ ctx, params, searchParams, input }) => {
    const caller = createTasksCaller(ctx);
    const taskId = await caller.create({
      projectId: params.projectId,
      ...input,
    });
    if (searchParams.notify) {
      await caller.schedule.now.sendNotification({ taskId });
    }
    return { taskId, projectId: params.projectId };
  });
```

## FormData Uploads

```ts
// Server
export const upload = authRoute
  .post("/api/files/upload")
  .form(
    z.object({
      file: z.instanceof(File),
      title: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
  )
  .mutation(async ({ ctx, c, form }) => {
    const storageId = await ctx.storage.store(form.file);
    return c.json({ storageId, filename: form.file.name });
  });

// Client
uploadFile.mutate({
  form: { file: selectedFile, title: "My Document", tags: ["work"] },
});
```

## Metadata & Middleware

```ts
export const heavyEndpoint = publicRoute
  .meta({ ratelimit: "api/heavy" })
  .get("/api/reports")
  .query(async ({ ctx }) => {
    const caller = createReportsCaller(ctx);
    return caller.generate({});
  });

// Chained meta (shallow merge)
export const adminEndpoint = authRoute
  .meta({ role: "admin" })
  .meta({ ratelimit: "api/admin" })
  .delete("/api/users/:id")
  .params(z.object({ id: z.string() }))
  .mutation(async ({ ctx, params }) => {
    const caller = createAdminCaller(ctx);
    await caller.deleteUser({ id: params.id });
  });

// Custom middleware extending context
export const withPermissions = authRoute
  .use(async ({ ctx, next }) => {
    const caller = createPermissionsCaller(ctx);
    const permissions = await caller.get({ userId: ctx.userId });
    return next({ ctx: { ...ctx, permissions } });
  })
  .get("/api/protected")
  .query(async ({ ctx }) => {
    if (!ctx.permissions.includes("admin")) {
      throw new CRPCError({ code: "FORBIDDEN", message: "Admin required" });
    }
    return { data: "secret" };
  });
```

## Optional Auth

```ts
export const publicOrAuth = optionalAuthRoute
  .get("/api/content")
  .query(async ({ ctx }) => {
    const caller = createContentCaller(ctx);
    const userId: Id<"user"> | null = ctx.userId;
    if (userId) return caller.personalized({ userId });
    return caller.public({});
  });
```

## Error Handling

See [Error Codes](#error-codes) in API Reference. Zod validation failures auto-return `400 Bad Request` with error details.

## Custom Responses

cRPC handlers receive `c` (Hono Context) for custom responses:

```ts
// File download
export const download = authRoute
  .get("/api/todos/export/:format")
  .params(z.object({ format: z.enum(["json", "csv"]) }))
  .query(async ({ ctx, params, c }) => {
    const caller = createTodosCaller(ctx);
    const todos = await caller.list({ limit: 100 });
    c.header(
      "Content-Disposition",
      `attachment; filename="todos.${params.format}"`
    );
    c.header("Cache-Control", "no-cache");
    if (params.format === "csv") {
      const csv = [
        "id,title,completed",
        ...todos.map((t) => `${t.id},${t.title},${t.completed}`),
      ].join("\n");
      return c.text(csv);
    }
    return c.json({ todos });
  });

// Redirect
export const redirect = publicRoute
  .get("/api/old-path")
  .query(async ({ c }) => c.redirect("/api/new-path", 301));
```

| Method                     | Description          |
| -------------------------- | -------------------- |
| `c.json(data)`             | Return JSON response |
| `c.text(str)`              | Return text response |
| `c.redirect(url, status?)` | Return redirect      |
| `c.header(name, value)`    | Set response header  |
| `c.req.header(name)`       | Get request header   |
| `c.req.text()`             | Get raw body as text |

## Streaming

### Server-Sent Events

```ts
import { streamText } from "hono/streaming";

export const events = publicRoute
  .get("/api/stream")
  .query(async ({ ctx, c }) => {
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    return streamText(c, async (stream) => {
      for (let i = 0; i < 10; i++) {
        const caller = createDataCaller(ctx);
        const data = await caller.getChunk({ index: i });
        await stream.write(`data: ${JSON.stringify(data)}\n\n`);
        await stream.sleep(1000);
      }
    });
  });
```

### AI Streaming

```ts
import { stream } from "hono/streaming";

export const chat = publicRoute
  .post("/api/ai/stream")
  .input(z.object({ prompt: z.string() }))
  .mutation(async ({ ctx, input, c }) => {
    const aiCaller = createAiCaller(ctx);
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    const aiStream = await aiCaller.actions.streamResponse({
      prompt: input.prompt,
    });
    return stream(c, async (stream) => {
      await stream.pipe(aiStream);
    });
  });
```

## Rate Limiting

```ts
export const ratelimited = publicRoute
  .post("/api/public")
  .input(z.object({ data: z.string() }))
  .mutation(async ({ ctx, input, c }) => {
    const ip =
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
      c.req.header("CF-Connecting-IP") ??
      "unknown";
    const ratelimitCaller = createRatelimitCaller(ctx);
    const allowed = await ratelimitCaller.check({
      key: `http:${ip}`,
      limit: 100,
      window: 3600000,
    });
    if (!allowed)
      return c.text("Rate limit exceeded", 429, { "Retry-After": "3600" });
    const apiCaller = createApiCaller(ctx);
    const result = await apiCaller.process({ data: input.data });
    return c.json(result);
  });
```

## Webhooks

### Stripe

```ts
export const stripeWebhook = publicRoute
  .post("/webhooks/stripe")
  .mutation(async ({ ctx, c }) => {
    const stripeCaller = createStripeCaller(ctx);
    const signature = c.req.header("stripe-signature");
    if (!signature)
      throw new CRPCError({ code: "BAD_REQUEST", message: "No signature" });

    const body = await c.req.text();
    const isValid = await stripeCaller.actions.verify({ body, signature });
    if (!isValid)
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Invalid signature",
      });

    const event = JSON.parse(body);
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentsCaller = createPaymentsCaller(ctx);
        await paymentsCaller.markPaid({
          paymentIntentId: event.data.object.id,
        });
        break;
      case "customer.subscription.deleted":
        const subscriptionsCaller = createSubscriptionsCaller(ctx);
        await subscriptionsCaller.cancel({
          subscriptionId: event.data.object.id,
        });
        break;
    }
    return c.text("OK", 200);
  });
```

### Discord Bot

```ts
import { verifyKey } from "discord-interactions";

export const discordWebhook = publicRoute
  .post("/webhooks/discord")
  .mutation(async ({ ctx, c }) => {
    const signature = c.req.header("X-Signature-Ed25519");
    const timestamp = c.req.header("X-Signature-Timestamp");
    if (!signature || !timestamp)
      throw new CRPCError({
        code: "UNAUTHORIZED",
        message: "Missing signature",
      });

    const body = await c.req.text();
    if (
      !verifyKey(body, signature, timestamp, process.env.DISCORD_PUBLIC_KEY!)
    ) {
      throw new CRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid signature",
      });
    }

    const interaction = JSON.parse(body);
    if (interaction.type === 1) return c.json({ type: 1 }); // PING
    if (interaction.type === 2) {
      const statsCaller = createStatsCaller(ctx);
      const discordCaller = createDiscordCaller(ctx);
      switch (interaction.data.name) {
        case "stats":
          const stats = await statsCaller.get({});
          return c.json({
            type: 4,
            data: { content: `Users: ${stats.users}, Posts: ${stats.posts}` },
          });
        case "create":
          await discordCaller.schedule.now.processCreate({
            token: interaction.token,
          });
          return c.json({ type: 5 }); // DEFERRED
        default:
          return c.json({ type: 4, data: { content: "Unknown command" } });
      }
    }
    if (interaction.type === 3) {
      const discordCaller = createDiscordCaller(ctx);
      await discordCaller.handleButton({
        customId: interaction.data.custom_id,
        userId: interaction.user.id,
      });
      return c.json({ type: 7, data: { content: "Done!" } });
    }
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "Unknown interaction",
    });
  });
```

## React Client

See [Input Args](#input-args) in API Reference.

### Query Patterns

```ts
// GET with searchParams
crpc.http.todos.list.queryOptions({ searchParams: { limit: "10" } });

// GET with path params
crpc.http.todos.get.queryOptions({ params: { id: todoId } });

// GET with custom headers
crpc.http.todos.list.queryOptions({
  searchParams: { limit: "10" },
  headers: { "X-Custom": "value" },
});

// Override the default 30s staleTime
crpc.http.todos.list.queryOptions(
  { searchParams: { limit: "10" } },
  { staleTime: 0 }
);
```

`queryOptions` defaults to a 30 second `staleTime` so RSC-prefetched entries hydrate
without an immediate refetch. `refetchOnMount` keeps TanStack's default, so a route
invalidated while unmounted still refetches.

### One-Time Fetch

```ts
// For exports/downloads (no caching, mutation semantics)
const exportTodos = useMutation(crpc.http.todos.export.mutationOptions());
exportTodos.mutate({ params: { format: "csv" } });
```

### Vanilla Client

```ts
const client = useCRPCClient();
const todos = await client.http.todos.list.query();
await client.http.todos.create.mutate({ title: "New todo" });

// For cache-aware fetches in render context
const queryClient = useQueryClient();
const todos = await queryClient.fetchQuery(crpc.http.todos.list.queryOptions());
```

### staticQueryOptions

For prefetching in event handlers (doesn't use hooks internally):

```ts
const queryClient = useQueryClient();
const handleMouseEnter = () => {
  queryClient.prefetchQuery(crpc.http.todos.list.staticQueryOptions());
};
```

`staticQueryOptions` doesn't include reactive auth state. Auth handled at execution time.

### Mutation Patterns

```ts
const createTodo = useMutation(
  crpc.http.todos.create.mutationOptions({ onSuccess: () => queryClient.invalidateQueries(...) })
);

createTodo.mutate({ title: 'New Todo' }); // JSON body at root
updateTodo.mutate({ params: { id: '123' }, completed: true }); // PATCH with params + body
deleteTodo.mutate({ params: { id: '123' } }); // DELETE with params
uploadFile.mutate({ form: { file: selectedFile, description: 'My file' } }); // FormData
```

### Cache Invalidation

```ts
const updateTodo = useMutation(
  crpc.http.todos.update.mutationOptions({
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(crpc.http.todos.list.queryFilter());
      queryClient.invalidateQueries(
        crpc.http.todos.get.queryFilter({ params: { id: vars.params?.id } })
      );
    },
  })
);
```

### Cache Keys

```ts
const queryKey = crpc.http.todos.list.queryKey();
// => ['httpQuery', 'todos.list', {}]
queryClient.getQueryData(queryKey);

crpc.http.todos.get.queryKey({ params: { id: '123' } });
// => ['httpQuery', 'todos.get', { params: { id: '123' } }]
```

`queryKey()` is the exact key `queryOptions()` and RSC prefetching store under, so
`getQueryData`/`setQueryData` hit. Use `queryFilter()` to match every args variant.

See [Client Methods](#client-methods) in API Reference.

## RSC Prefetching

```tsx
// app/todos/page.tsx
import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

export default async function TodosPage() {
  prefetch(
    crpc.http.todos.list.queryOptions({ searchParams: { limit: "10" } })
  );
  return (
    <HydrateClient>
      <TodoList />
    </HydrateClient>
  );
}
```

### Awaited Prefetch

```tsx
const todo = await preloadQuery(
  crpc.http.todos.get.queryOptions({ params: { id } })
);
if (!todo) notFound();
```

### Auth-Aware Prefetch

```tsx
prefetch(
  crpc.http.todos.list.queryOptions(
    { searchParams: { limit: "10" } },
    { skipUnauth: true }
  )
);
```

| Pattern          | Blocking | Server Access | Client Hydration |
| ---------------- | -------- | ------------- | ---------------- |
| `prefetch()`     | No       | No            | Yes              |
| `preloadQuery()` | Yes      | Yes           | Yes              |

## Server-Side Calls

```ts
import { createContext } from "@/lib/convex/server";

const ctx = await createContext({ headers: request.headers });
const todos = await ctx.caller.todos.list({ limit: 10 });
if (ctx.isAuthenticated) await ctx.caller.todos.create({ title: "New task" });
```

## API Reference

### Route Builder Patterns

- `publicRoute.get("/path").query()` for public GET.
- `authRoute.post("/path").mutation()` for authenticated writes.
- `optionalAuthRoute.get("/path").query()` for optional-auth reads.
- Chain `.params(...)`, `.searchParams(...)`, `.input(...)`, `.form(...)`,
  `.output(...)`, `.meta(...)`, and `.use(...)` as needed.
- Use `router({ endpoint })` for feature-level endpoint groups.

### HTTP Methods

Use `.get().query()` for reads, `.post().mutation()` for creates,
`.patch().mutation()` for partial updates, and `.delete().mutation()` for
deletes. GET/DELETE should not carry JSON bodies.

### Error Codes

Map expected failures through `CRPCError`: `BAD_REQUEST` 400, `UNAUTHORIZED`
401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409,
`UNPROCESSABLE_CONTENT` 422, `TOO_MANY_REQUESTS` 429, and
`INTERNAL_SERVER_ERROR` 500.

### Input Args

Client args can include `params`, `searchParams`, `form`, custom `fetch`,
`init`, `headers`, and root JSON body fields.

### Client Methods

Generated clients expose `queryOptions`, `staticQueryOptions`,
`mutationOptions`, `queryKey` (exact cache key), and `queryFilter` (matches every
args variant when called without args).
