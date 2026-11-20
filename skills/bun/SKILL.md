---
name: bun
description: Bun-native replacements for Node APIs, npm packages and dev tools. Use for every coding task in a project that runs on Bun (bun.lock, bunfig.toml, @types/bun) — writing code or scripts, formatting, linting, type checking, testing, bundling, installing packages — and whenever Bun is named as the runtime.
---

# Bun

Bun ships a **Bun-native** API for most jobs a Node project solves with a built-in module or an npm package. Bun-native is the default choice: faster, fewer dependencies, and what Bun's docs recommend. Node APIs stay the choice only where Bun has no native equivalent (the table marks those).

Baseline: Bun **1.4.5**. The table below is a cache of the live docs; the docs win when they disagree.

## Steps

1. **Confirm the runtime.** Bun project = `bun.lock`/`bun.lockb`, `bunfig.toml`, `@types/bun`, or scripts that call `bun`. Run `bun --version`; if it is above the baseline, read the release notes (`/blog/bun-v<version>`) for each version past 1.4.5 before writing code.
2. **Map every Node API or package you are about to use** against the table. Done when each `node:*` import, npm dependency and CLI tool in your change is either Bun-native or marked _keep_ in the table.
3. **Write it from the snippets.** [REFERENCE.md](REFERENCE.md) has a verified snippet for every row of the map; read the sections for the rows you use and write the code from them. Reach for [Docs lookup](#docs-lookup) only when `bun check` or a run goes red on a snippet's API, or the task needs an API no snippet shows.
4. **Verify with Bun's own tools**: `bun check`, `bun lint`, `bun fmt --check`, `bun test`. Before relying on a command or flag, confirm it with `bun <command> --help`; a command missing from the installed version means fall back to the project's existing script.

## Node → Bun-native map

| Job | Bun-native | Doc path |
| --- | --- | --- |
| Shell scripting (`child_process.exec`, `execa`, `zx`) | ``Bun.$`cmd` `` — escapes interpolations, cross-platform | `/docs/runtime/shell` |
| Child processes (`spawn`, `fork`, IPC) | `Bun.spawn` / `Bun.spawnSync` | `/docs/runtime/child-process` |
| Pseudo-terminal (`node-pty`) | `Bun.spawn(cmd, { terminal })` | `/docs/runtime/child-process` |
| Read/write files, downloads (`fs.readFile`, `fs.writeFile`, `stream.pipeline`) | `Bun.file(p).text()/.json()/.bytes()/.stream()`, `Bun.write(path, data \| await fetch(url))` | `/docs/runtime/file-io` |
| tar archives (`tar`, `archiver`) | `Bun.Archive` | `/docs/runtime/archive` |
| Compression (`pako`, `node:zlib`) | `Bun.gzipSync` / `Bun.gunzipSync`, `CompressionStream` (gzip, brotli, zstd) | `/docs/runtime/utils` |
| Directories (`mkdir`, `readdir`, `rm`) | _keep_ `node:fs/promises` — Bun's docs recommend it | `/docs/runtime/file-io` |
| Globbing (`glob`, `fast-glob`) | `new Bun.Glob(pattern).scan()` | `/docs/runtime/glob` |
| SQLite (`better-sqlite3`, `sqlite3`) | `import { Database } from "bun:sqlite"` | `/docs/runtime/sqlite` |
| Postgres / MySQL (`pg`, `postgres`, `mysql2`) | `import { sql, SQL } from "bun"` | `/docs/runtime/sql` |
| Redis (`ioredis`, `redis`) | `import { redis, RedisClient } from "bun"` | `/docs/runtime/redis` |
| S3 (`@aws-sdk/client-s3`) | `import { s3, S3Client } from "bun"` | `/docs/runtime/s3` |
| HTTP server (`http.createServer`, `express`, `fastify`) | `Bun.serve({ routes: { "/todos": { GET, POST } }, fetch })` | `/docs/runtime/http/server`, `/docs/runtime/http/routing` |
| Serve a static folder (`express.static`, `serve-static`, `sirv`, hand-rolled `Bun.file` handlers) | route `"/assets/*": { dir: "./public" }` — Content-Type, ETag, Range, index.html and path traversal handled | `/docs/runtime/http/routing` |
| WebSockets (`ws`, `socket.io`) | `Bun.serve({ websocket })` | `/docs/runtime/http/websockets` |
| Cookies (`cookie`, `cookie-parser`) | `req.cookies`, `Bun.CookieMap` | `/docs/runtime/http/cookies` |
| URL matching (`path-to-regexp`) | `URLPattern` (standard) | MDN `URLPattern` |
| HTTP client with its own TLS/proxy/pool (undici `Agent`, `https-proxy-agent`, `axios.create`) | `Bun.FetchSession`, `fetch(url, { proxy, tls })` | `/docs/runtime/networking/fetch` |
| Password hashing (`bcrypt`, `argon2`) | `Bun.password.hash` / `.verify` | `/docs/runtime/hashing` |
| Fast hashing (`xxhash`, `crypto.createHash`) | `Bun.hash`, `Bun.CryptoHasher` | `/docs/runtime/hashing` |
| Env vars (`dotenv`) | `.env` loads automatically; `Bun.env` | `/docs/runtime/environment-variables` |
| YAML / TOML / JSON5 / JSONC / JSONL (`js-yaml`, `jsonc-parser`, `strip-json-comments`, `ndjson`) | `Bun.YAML`, `Bun.TOML`, `Bun.JSON5`, `Bun.JSONC`, `Bun.JSONL`, or `import` the file | `/docs/runtime/yaml`, `/docs/runtime/toml`, `/docs/runtime/json5` |
| Semver (`semver`) | `Bun.semver` | `/docs/runtime/semver` |
| OS keychain (`keytar`) | `Bun.secrets` | `/docs/runtime/secrets` |
| `__dirname`, `require.main === module` | `import.meta.dir`, `import.meta.main` | `/docs/runtime/module-resolution` |
| Sleep, deep-equal, terminal text, ids (`strip-ansi`, `string-width`, `wrap-ansi`, `slice-ansi`, `cli-truncate`, `uuid`, `which`) | `Bun.sleep`, `Bun.deepEquals`, `Bun.stripANSI`, `Bun.stringWidth`, `Bun.wrapAnsi`, `Bun.sliceAnsi`, `Bun.randomUUIDv7`, `Bun.which` | `/docs/runtime/utils` |
| Dates and times (`moment`, `dayjs`, `date-fns`, `luxon`) | `Temporal` (standard, global) | MDN `Temporal` |
| Cron jobs (`node-cron`, `cron`) | `Bun.cron(schedule, fn)` | `/docs/runtime/cron` |
| Images (`sharp`, `jimp`) | `Bun.file(p).image()`, `Bun.Image` | `/docs/runtime/image` |
| Browser automation, scraping (`puppeteer`, `playwright`) | `Bun.WebView` | `/docs/runtime/webview` |
| Markdown → HTML (`marked`, `markdown-it`) | `Bun.markdown.html` | `/docs/runtime/markdown` |
| XML (`fast-xml-parser`, `xml2js`) | `Bun.XML.parse` / `.stringify` | `/docs/runtime/xml` |
| Run TS (`ts-node`, `tsx`, `nodemon`) | `bun file.ts`, `bun --watch`, `bun --hot` | `/docs/runtime` |
| Run scripts together (`concurrently`, `npm-run-all`) | `bun run --parallel a b`, `--sequential`, `"build:*"`, `--filter` | `/docs/runtime` |
| Profiling (`0x`, `clinic`) | `bun --cpu-prof-md`, `bun --heap-prof-md` (Markdown reports to read) | `/docs/project/benchmarking` |
| Packages (`npm`, `npx`, `npm view`, `npm version`, `license-checker`) | `bun install`, `bun add`, `bunx`, `bun info`, `bun pm version`, `bun pm licenses`, `bun audit fix` | `/docs/pm/cli/install` |
| Tests (`jest`, `vitest`) | `bun test` + `import { test, expect, mock } from "bun:test"` | `/docs/test` |
| Test mocks, fake timers (`jest.mock`, `sinon`, `vi.useFakeTimers`) | `mock`, `spyOn`, `mock.module`, `jest.useFakeTimers`, `setSystemTime` from `bun:test` | `/docs/test/mocks` |
| Frontend dev server, full-stack app (`vite`, `webpack-dev-server`) | `bun ./index.html`, or `import page from "./index.html"` as a `Bun.serve` route | `/docs/bundler/fullstack` |
| Bundling (`esbuild`, `webpack`, `tsup`) | `bun build` / `Bun.build` | `/docs/bundler` |
| Single-file executable (`pkg`, `nexe`) | `bun build --compile` | `/docs/compiler/executables` |
| Formatting (`prettier`) | `bun fmt` | `/docs/format` |
| Linting (`eslint`, `oxlint`) | `bun lint` | `/docs/lint` |
| Type checking (`tsc --noEmit`) | `bun check` | `/docs/runtime/check` |

Any job absent from this table: `search_bun` for a Bun-native option before adding a dependency the user did not name.

## Docs lookup

The source of truth is the **Bun docs MCP server** at `https://bun.com/docs/mcp`: it indexes every docs page, guide and release note, including features newer than this skill.

- `search_bun` — ranked search; start here (`"bun lint"`, `"Bun.serve websocket"`).
- `read_bun_page` — full markdown of a path from the table (`/docs/runtime/shell`).
- `grep_bun` — exact identifiers, flags, error messages.

When those tools are not connected, call the same server over HTTP (stateless JSON-RPC):

```sh
curl -s https://bun.com/docs/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_bun","arguments":{"query":"bun lint","limit":5}}}'
```

Any doc path also reads as raw markdown at `https://bun.com<path>.md`.
