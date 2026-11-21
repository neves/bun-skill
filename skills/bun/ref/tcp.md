Docs: `/docs/runtime/networking/tcp`

```ts
const server = Bun.listen({
  hostname: "127.0.0.1", port: 9000,
  socket: { data(socket, data) { socket.write(data); }, open(socket) {}, close(socket) {} },
});
await Bun.connect({
  hostname: "127.0.0.1", port: 9000,
  socket: { open(socket) { socket.write("ping"); }, data(socket, data) { console.log(data.toString()); socket.end(); } },
});
```
