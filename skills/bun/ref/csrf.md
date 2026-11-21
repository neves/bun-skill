Docs: `/docs/runtime/csrf`

```ts
const secret = Bun.env.CSRF_SECRET; // omit both secrets to use a per-process random one
const token = Bun.CSRF.generate(secret, { sessionId, expiresIn: 60 * 60 * 1000 }); // string; default 24h
const ok = Bun.CSRF.verify(token, { secret, sessionId }); // boolean; sessionId must match generate()

Bun.serve({
  routes: {
    "/form": () => new Response(`<form method="post" action="/submit"><input type="hidden" name="csrf" value="${Bun.CSRF.generate(secret)}"><button>Send</button></form>`, { headers: { "Content-Type": "text/html" } }),
    "/submit": { POST: async (req) => {
      const token = String((await req.formData()).get("csrf") ?? req.headers.get("x-csrf-token") ?? "");
      return Bun.CSRF.verify(token, { secret }) ? new Response("ok") : new Response("Forbidden", { status: 403 });
    } },
  },
});
```
