Docs: `/docs/runtime/http/websockets`

```ts
Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req, { data: { user: "anon" } })) return;
    return new Response("Upgrade required", { status: 426 });
  },
  websocket: {
    open(ws) { ws.subscribe("chat"); },
    message(ws, msg) { ws.publish("chat", msg); }, // ws.publish skips the sender; server.publish reaches all
    close(ws) { ws.unsubscribe("chat"); },
  },
});
```
