Docs: `/docs/runtime/console`

```ts
const input = await Bun.stdin.text(); // whole stdin; also .json(), .stream()
for await (const line of console) { /* one line of stdin at a time */ }
const name = prompt("Name?"); // synchronous, string | null
```
