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
| Read/write files (`fs.readFile`, `fs.writeFile`) | `Bun.file(p).text()/.json()/.bytes()/.stream()`, `Bun.write` | `/docs/runtime/file-io` |
| Directories (`mkdir`, `readdir`, `rm`) | _keep_ `node:fs/promises` — Bun's docs recommend it | `/docs/runtime/file-io` |
| Globbing (`glob`, `fast-glob`) | `new Bun.Glob(pattern).scan()` | `/docs/runtime/glob` |
| SQLite (`better-sqlite3`, `sqlite3`) | `import { Database } from "bun:sqlite"` | `/docs/runtime/sqlite` |
| Postgres / MySQL (`pg`, `postgres`, `mysql2`) | `import { sql, SQL } from "bun"` | `/docs/runtime/sql` |
| Redis (`ioredis`, `redis`) | `import { redis, RedisClient } from "bun"` | `/docs/runtime/redis` |
| S3 (`@aws-sdk/client-s3`) | `import { s3, S3Client } from "bun"` | `/docs/runtime/s3` |
| HTTP server (`http.createServer`, `express`, `fastify`) | `Bun.serve({ routes: { "/todos": { GET, POST } }, fetch })` | `/docs/runtime/http/server`, `/docs/runtime/http/routing` |
| WebSockets (`ws`, `socket.io`) | `Bun.serve({ websocket })` | `/docs/runtime/http/websockets` |
| Cookies (`cookie`, `cookie-parser`) | `req.cookies`, `Bun.CookieMap` | `/docs/runtime/http/cookies` |
| Password hashing (`bcrypt`, `argon2`) | `Bun.password.hash` / `.verify` | `/docs/runtime/hashing` |
| Fast hashing (`xxhash`, `crypto.createHash`) | `Bun.hash`, `Bun.CryptoHasher` | `/docs/runtime/hashing` |
| Env vars (`dotenv`) | `.env` loads automatically; `Bun.env` | `/docs/runtime/environment-variables` |
| YAML / TOML / JSON5 parsing | `Bun.YAML`, `Bun.TOML`, `Bun.JSON5`, or `import` the file | `/docs/runtime/yaml`, `/docs/runtime/toml`, `/docs/runtime/json5` |
| Semver (`semver`) | `Bun.semver` | `/docs/runtime/semver` |
| OS keychain (`keytar`) | `Bun.secrets` | `/docs/runtime/secrets` |
| `__dirname`, `require.main === module` | `import.meta.dir`, `import.meta.main` | `/docs/runtime/module-resolution` |
| Sleep (`setTimeout` promise) | `await Bun.sleep(ms)` | `/docs/runtime/utils` |
| Run TS (`ts-node`, `tsx`, `nodemon`) | `bun file.ts`, `bun --watch`, `bun --hot` | `/docs/runtime/index` |
| Packages (`npm`, `npx`, `npm view`) | `bun install`, `bun add`, `bunx`, `bun info` | `/docs/pm/cli/install` |
| Tests (`jest`, `vitest`) | `bun test` + `import { test, expect, mock } from "bun:test"` | `/docs/test/index` |
| Bundling (`esbuild`, `webpack`, `tsup`) | `bun build` / `Bun.build` | `/docs/bundler/index` |
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
