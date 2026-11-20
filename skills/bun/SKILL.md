---
name: bun
description: Bun-native APIs and tooling for JavaScript/TypeScript. Use when the project runs on Bun (bun.lock, bunfig.toml, `bun` scripts, `@types/bun`), or when about to reach for a Node built-in or npm package for shell, processes, files, SQLite/SQL/Redis/S3, HTTP servers, WebSockets, hashing, tests, bundling, formatting, linting or type checking.
---

# Bun

Bun ships a **Bun-native** API for most jobs a Node project solves with a built-in module or an npm package. Bun-native is the default choice: faster, fewer dependencies, and what Bun's docs recommend. Node APIs stay the choice only where Bun has no native equivalent (the table marks those).

Baseline: Bun **1.4.5**. The table below is a cache of the live docs; the docs win when they disagree.

## Steps

1. **Confirm the runtime.** Bun project = `bun.lock`/`bun.lockb`, `bunfig.toml`, `@types/bun`, or scripts that call `bun`. Run `bun --version`; if it is above the baseline, read the release notes at `https://bun.com/blog/bun-v<version>` for each version past 1.4.5 before writing code.
2. **Map every Node API or package you are about to use** against the table. Done when each `node:*` import, npm dependency and CLI tool in your change is either Bun-native or marked _keep_ in the table.
3. **Learn the API from the docs before writing it.** Fetch the index at https://bun.sh/llms.txt, pick the page for the API, and fetch that page's `.md` URL (pattern `https://bun.com/docs/<section>/<page>.md`). Read the page itself rather than coding from memory; Bun APIs move between releases. Avoid `llms-full.txt` (≈2 MB).
4. **Verify with Bun's own tools**: `bun check`, `bun lint`, `bun fmt --check`, `bun test`. Before relying on a command or flag, confirm it with `bun <command> --help`; a command missing from the installed version means fall back to the project's existing script.

## Node → Bun-native map

| Job | Bun-native | Doc page |
| --- | --- | --- |
| Shell scripting (`child_process.exec`, `execa`, `zx`) | ``Bun.$`cmd` `` — escapes interpolations, cross-platform | `runtime/shell` |
| Child processes (`spawn`, `fork`, IPC) | `Bun.spawn` / `Bun.spawnSync` | `runtime/child-process` |
| Read/write files (`fs.readFile`, `fs.writeFile`) | `Bun.file(p).text()/.json()/.bytes()/.stream()`, `Bun.write` | `runtime/file-io` |
| Directories (`mkdir`, `readdir`, `rm`) | _keep_ `node:fs/promises` — Bun's docs recommend it | `runtime/file-io` |
| Globbing (`glob`, `fast-glob`) | `new Bun.Glob(pattern).scan()` | `runtime/glob` |
| SQLite (`better-sqlite3`, `sqlite3`) | `import { Database } from "bun:sqlite"` | `runtime/sqlite` |
| Postgres / MySQL (`pg`, `postgres`, `mysql2`) | `import { sql, SQL } from "bun"` | `runtime/sql` |
| Redis (`ioredis`, `redis`) | `import { redis, RedisClient } from "bun"` | `runtime/redis` |
| S3 (`@aws-sdk/client-s3`) | `import { s3, S3Client } from "bun"` | `runtime/s3` |
| HTTP server (`http.createServer`, `express`, `fastify`) | `Bun.serve({ routes, fetch })` | `runtime/http/server`, `runtime/http/routing` |
| WebSockets (`ws`, `socket.io`) | `Bun.serve({ websocket })` | `runtime/http/websockets` |
| Cookies (`cookie`, `cookie-parser`) | `req.cookies`, `Bun.CookieMap` | `runtime/http/cookies` |
| Password hashing (`bcrypt`, `argon2`) | `Bun.password.hash` / `.verify` | `runtime/hashing` |
| Fast hashing (`xxhash`, `crypto.createHash`) | `Bun.hash`, `Bun.CryptoHasher` | `runtime/hashing` |
| Env vars (`dotenv`) | `.env` loads automatically; `Bun.env` | `runtime/environment-variables` |
| YAML / TOML / JSON5 parsing | `Bun.YAML`, `Bun.TOML`, `Bun.JSON5`, or `import` the file | `runtime/yaml`, `runtime/toml`, `runtime/json5` |
| Semver (`semver`) | `Bun.semver` | `runtime/semver` |
| OS keychain (`keytar`) | `Bun.secrets` | `runtime/secrets` |
| `__dirname`, `require.main === module` | `import.meta.dir`, `import.meta.main` | `runtime/module-resolution` |
| Sleep (`setTimeout` promise) | `await Bun.sleep(ms)` | `runtime/utils` |
| Run TS (`ts-node`, `tsx`, `nodemon`) | `bun file.ts`, `bun --watch`, `bun --hot` | `runtime/index` |
| Packages (`npm`, `npx`, `pnpm`) | `bun install`, `bun add`, `bunx` / `bun x` | `pm/cli/install` |
| Tests (`jest`, `vitest`) | `bun test` + `import { test, expect, mock } from "bun:test"` | `test/index` |
| Bundling (`esbuild`, `webpack`, `tsup`) | `bun build` / `Bun.build` | `bundler/index` |
| Formatting (`prettier`) | `bun fmt` | `format` |
| Linting (`eslint`, `oxlint`) | `bun lint` | `lint` |
| Type checking (`tsc --noEmit`) | `bun check` | `bun check --help` |

`format` and `lint` are missing from `llms.txt`; reach them directly at `https://bun.com/docs/format.md` and `https://bun.com/docs/lint.md`. Any job absent from this table: search `llms.txt` for it before adding a dependency.
