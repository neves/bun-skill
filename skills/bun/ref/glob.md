Docs: `/docs/runtime/glob`

```ts
const glob = new Bun.Glob("**/*.ts");
for await (const path of glob.scan({ cwd: "src" })) { /* path is relative to cwd */ }
glob.match("src/a.ts"); // true
```
