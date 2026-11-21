Docs: `/docs/runtime/http/server`, `/docs/runtime/http/routing`

```ts
const server = Bun.serve({
  port: Number(Bun.env.PORT ?? 3000),
  routes: {
    "/health": new Response("ok"),
    "/todos": {
      GET: () => Response.json(todos),
      POST: async (req) => Response.json(await req.json(), { status: 201 }),
    },
    "/todos/:id": (req) => Response.json(todos[Number(req.params.id)]),
  },
  "/static/*": { dir: "./public" }, // static folder: Content-Type, ETag, Range, index.html handled
  fetch: () => new Response("Not Found", { status: 404 }), // fallback
});
server.stop();
```
