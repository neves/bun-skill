Docs: `/docs/runtime/http/cookies`

```ts
Bun.serve({
  routes: {
    "/": (req) => {
      let id = req.cookies.get("session");
      if (!id) req.cookies.set("session", (id = crypto.randomUUID()), { httpOnly: true, path: "/" });
      return new Response(id); // cookies set on req.cookies are sent automatically
    },
  },
});
const jar = new Bun.CookieMap("a=1; b=2"); // outside Bun.serve
```
