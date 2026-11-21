Docs: `/docs/runtime/archive`

```ts
const archive = new Bun.Archive({ "README.md": "# hi", "src/index.ts": code }, { compress: "gzip" });
await Bun.write("out.tar.gz", archive);
const extracted = new Bun.Archive(await Bun.file("pkg.tar.gz").bytes());
await extracted.extract("./output"); // entry count
for (const [path, file] of await extracted.files()) console.log(path, await file.text());
```
