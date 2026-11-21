Docs: `/docs/runtime/networking/fetch`

```ts
await fetch(url, { proxy: "http://proxy:8080", tls: { rejectUnauthorized: false } }); // per request
using session = new Bun.FetchSession({ // own TLS, proxy and keep-alive pool
  tls: { ca: await Bun.file("corp-ca.pem").text() },
  proxy: { url: "http://proxy.internal:8080" },
  keepAlive: { idleTimeout: 30, maxIdleSockets: 8 },
});
const res = await session.fetch("https://api.example.com"); // session.fetch is bound: new Client({ fetch: session.fetch })
```
