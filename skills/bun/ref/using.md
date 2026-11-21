Docs: standard `using`

```ts
await using proc = Bun.spawn(["bun", "server.ts"]); // killed and awaited at scope exit
using spy = spyOn(api, "fetchUser"); // restored at scope exit
await using view = new Bun.WebView(); // also Bun.FetchSession
```
