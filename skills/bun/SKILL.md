---
name: bun
description: Bun-native replacements for Node APIs, npm packages and dev tools. Use for every coding task in a Bun project (bun.lock, bunfig.toml, @types/bun) — code, scripts, formatting, linting, type checking, tests, bundling, installs — and whenever Bun is the runtime.
---

# Bun

Bun-native is the default; a Node API stays only where the map says _keep_. Baseline **Bun 1.4.5**; the live docs win over this map.

1. Run `bun --version`. Above 1.4.5: read `/blog/bun-v<version>` for each newer release first.
2. Map every `node:*` import, npm dependency and CLI tool in your change. Done when each is Bun-native or _keep_.
3. Write each from its snippet, `ref/<snippet>.md` beside this file, already verified against the docs. A red `bun check` or run on a snippet's API, or a job not in the map: [ref/docs.md](ref/docs.md), and `search_bun` before adding a dependency the user did not name.
4. Verify with `bun check`, `bun lint`, `bun fmt --check`, `bun test`. Confirm a command or flag with `bun <cmd> --help`; missing from the installed version → use the project's existing script.

## API map

| Replaces | Bun-native | Snippet |
| --- | --- | --- |
| `child_process.exec`, `execa`, `zx` | ``Bun.$`cmd` `` (escapes interpolations) | shell |
| `spawn`, `fork`, IPC, `node-pty` | `Bun.spawn` (`terminal` for a pty), `Bun.spawnSync` | spawn |
| `readline`, `process.stdin`, `get-stdin`, `prompts` | `Bun.stdin.text()`, `for await (const line of console)`, `prompt()` | stdin |
| `yargs`, `commander`, `minimist`, `meow`, `process.argv` parsing | `parseArgs` from `"util"` over `Bun.argv.slice(2)` | argv |
| `node:net` | `Bun.listen`, `Bun.connect` | tcp |
| `fs.readFile`, `fs.writeFile`, `stream.pipeline` downloads | `Bun.file(p).text()/.json()/.stream()`, `Bun.write(p, data \| await fetch(url))` | files |
| `mkdir`, `readdir`, `rm` | _keep_ `node:fs/promises` | files |
| `tar`, `archiver` | `Bun.Archive` | archive |
| `pako`, `node:zlib` | `Bun.gzipSync`, `Bun.zstdCompressSync`, `CompressionStream` | compression |
| `glob`, `fast-glob` | `Bun.Glob` | glob |
| `better-sqlite3`, `sqlite3` | `Database` from `"bun:sqlite"` | sqlite |
| `pg`, `postgres`, `mysql2` | `sql`, `SQL` from `"bun"` | sql |
| `ioredis`, `redis` | `redis`, `RedisClient` from `"bun"` | redis |
| `@aws-sdk/client-s3` | `s3`, `S3Client` from `"bun"` | s3 |
| `http.createServer`, `express`, `fastify`, `express.static`, `serve-static`, `sirv` | `Bun.serve({ routes, fetch })`; static folder: route `"/x/*": { dir }` | serve |
| `ws`, `socket.io` | `Bun.serve({ websocket })` | websocket |
| `cookie`, `cookie-parser` | `req.cookies`, `Bun.CookieMap` | cookies |
| `csurf`, `csrf-csrf` | `Bun.CSRF.generate` / `.verify` | csrf |
| `path-to-regexp` | `URLPattern` | urlpattern |
| undici `Agent`, `https-proxy-agent`, `axios.create` | `fetch(url, { proxy, tls })`, `Bun.FetchSession` | fetch |
| `bcrypt`, `argon2`, `xxhash`, `crypto.createHash` | `Bun.password`, `Bun.hash`, `Bun.CryptoHasher` | hashing |
| `dotenv`, `dotenv-cli`, `env-cmd` | `.env` auto-loads, `Bun.env`, `bun --env-file` | env |
| `js-yaml`, `jsonc-parser`, `strip-json-comments`, `ndjson` | `Bun.YAML`/`TOML`/`JSON5`/`JSONC`/`JSONL`, or `import` the file | formats |
| `semver` | `Bun.semver` | semver |
| `keytar` | `secrets` from `"bun"` | secrets |
| `__dirname`, `__filename`, `require.main === module` | `import.meta.dir` / `.path` / `.main` | paths |
| `escape-html`, `he`, `chalk` hex colors, `tinycolor2`, `strip-ansi`, `string-width`, `wrap-ansi`, `slice-ansi`, `cli-truncate`, `uuid`, `which`, sleep, deep-equal | `Bun.escapeHTML`, `Bun.color`, `Bun.stripANSI`, `Bun.stringWidth`, `Bun.wrapAnsi`, `Bun.sliceAnsi`, `Bun.randomUUIDv7`, `Bun.which`, `Bun.sleep`, `Bun.deepEquals` | utils |
| `moment`, `dayjs`, `date-fns`, `luxon` | `Temporal` | temporal |
| `try/finally` + `close()` | `using` / `await using` | using |
| `node-cron`, `cron` | `Bun.cron` | cron |
| `sharp`, `jimp` | `Bun.file(p).image()`, `Bun.Image` | image |
| `puppeteer`, `playwright` | `Bun.WebView` | webview |
| `marked`, `markdown-it` | `Bun.markdown.html` | markdown |
| `fast-xml-parser`, `xml2js` | `XML` from `"bun"` | xml |
| `jest`, `vitest`, `sinon`, `c8`, `nyc`, `jest --shard` | `bun test` + `bun:test` (`mock`, `spyOn`, `mock.module`, fake timers), `--coverage`, `--shard`, `--changed`, `--retry` | test |
| `vite`, `webpack-dev-server` | `bun ./index.html`; `import page from "./index.html"` as a `Bun.serve` route | fullstack |
| `esbuild`, `webpack`, `tsup`, `@babel/core`, `pkg`, `nexe`, `webpack-bundle-analyzer` | `bun build` / `Bun.build`, `Bun.Transpiler`, `--compile`, `--metafile-md` | build |

## Command map

| Replaces | Bun |
| --- | --- |
| `ts-node`, `tsx`, `nodemon` | `bun file.ts`, `bun --watch`, `bun --hot` |
| `concurrently`, `npm-run-all` | `bun run --parallel a b`, `"build:*"`, `--sequential`, `--filter` |
| `0x`, `clinic` | `bun --cpu-prof-md`, `bun --heap-prof-md` (Markdown reports to read) |
| `npm install`/`ci`/`view`/`version`/`publish`, `npx`, `npm-check-updates`, `license-checker` | `bun install` (`--frozen-lockfile`), `bun add`, `bun info`, `bun pm version`, `bun publish`, `bunx`, `bun update -i`, `bun pm licenses`, `bun audit fix` |
| `patch-package` | `bun patch <pkg>`, edit `node_modules/<pkg>`, `bun patch --commit <pkg>` |
| `npm init`, `npm create vite`, `create-react-app` | `bun init`, `bun init --react` (`=tailwind`, `=shadcn`), `bun create <template>` |
| `prettier`, `eslint`, `oxlint`, `tsc --noEmit` | `bun fmt`, `bun lint`, `bun check` |
