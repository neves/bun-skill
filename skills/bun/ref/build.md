Docs: `/docs/bundler`

```sh
bun build src/index.ts --outdir dist --target browser --minify
bun build src/cli.ts --compile --outfile app # single-file executable — `/docs/compiler/executables`
bun build src/index.ts --outdir dist --metafile-md=meta.md # Markdown module-graph report to read
```

```ts
await Bun.build({ entrypoints: ["src/index.ts"], outdir: "dist", target: "browser", minify: true });
const js = new Bun.Transpiler({ loader: "tsx" }).transformSync(code); // TS/JSX → JS string, no bundling
```
