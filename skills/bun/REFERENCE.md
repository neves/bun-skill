# Bun-native snippets

One snippet per row of the map in [SKILL.md](SKILL.md), already verified against the Bun 1.4.5 docs, so use them as written. Each one covers the common case. For anything a snippet leaves out, see the docs path in its heading (use the Docs lookup section of SKILL.md).

## Shell — `/docs/runtime/shell`

```ts
import { $ } from "bun";
const branch = (await $`git branch --show-current`.text()).trim(); // .text() is quiet
for await (const line of $`git branch --merged main`.lines()) { /* ... */ }
await $`git branch -d ${name}`; // interpolations are escaped, never shell-injected
const { exitCode } = await $`git diff --quiet`.nothrow(); // no throw on non-zero exit
```

## Child processes — `/docs/runtime/child-process`

```ts
const proc = Bun.spawn(["bun", "server.ts"], {
  stdout: "pipe", // proc.stdout is a ReadableStream; "inherit" passes it through
  stderr: "inherit",
  onExit(proc, exitCode, signalCode, error) { /* restart here */ },
});
for await (const chunk of proc.stdout) process.stdout.write(chunk);
const code = await proc.exited;
const { stdout } = Bun.spawnSync(["git", "status"]); // sync variant
```

## Files — `/docs/runtime/file-io`

```ts
const pkg = await Bun.file("package.json").json(); // also .text() .bytes() .stream() .exists()
await Bun.write("package.json", JSON.stringify(pkg, null, 2) + "\n");
await Bun.write("copy.png", Bun.file("logo.png"));
import { mkdir, readdir, rm } from "node:fs/promises"; // directories: node:fs is Bun's recommendation
```

## Glob — `/docs/runtime/glob`

```ts
const glob = new Bun.Glob("**/*.ts");
for await (const path of glob.scan({ cwd: "src" })) { /* path is relative to cwd */ }
glob.match("src/a.ts"); // true
```

## SQLite — `/docs/runtime/sqlite`

```ts
import { Database } from "bun:sqlite";
const db = new Database("todos.sqlite", { create: true, strict: true });
db.run("CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY, title TEXT, done INTEGER DEFAULT 0)");
db.query("INSERT INTO todos (title) VALUES ($title)").run({ title: "x" });
const rows = db.query("SELECT * FROM todos WHERE done = ?").all(0); // .get() for one row
```

## Postgres / MySQL — `/docs/runtime/sql`

```ts
import { sql, SQL } from "bun"; // `sql` reads DATABASE_URL
const users = await sql`SELECT * FROM users WHERE id = ${id}`; // parameterized
const [user] = await sql`INSERT INTO users ${sql({ name, email })} RETURNING *`; // object or array of objects
await sql.begin(async (tx) => { await tx`UPDATE users SET name = ${name} WHERE id = ${id}`; });
const mysql = new SQL("mysql://user:pass@localhost:3306/db");
```

## Redis — `/docs/runtime/redis`

```ts
import { redis, RedisClient } from "bun"; // `redis` reads REDIS_URL
await redis.set("key", "value");
await redis.expire("key", 3600); // TTL in seconds
const value = await redis.get("key"); // string | null
await redis.del("key");
const client = new RedisClient("redis://localhost:6379");
await redis.send("LPUSH", ["list", "a"]); // any other command
client.close();
```

## S3 — `/docs/runtime/s3`

```ts
// `s3` reads S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT (falls back to AWS_*)
import { s3, S3Client } from "bun";
await s3.write("uploads/report.pdf", Bun.file("report.pdf"), { type: "application/pdf" });
const url = s3.presign("uploads/report.pdf", { expiresIn: 3600 }); // sync, GET by default
const client = new S3Client({ bucket: "my-bucket", region: "us-east-1" });
```

## HTTP server — `/docs/runtime/http/server`, `/docs/runtime/http/routing`

```ts
const server = Bun.serve({
  port: Number(Bun.env.PORT ?? 3000),
  routes: {
    "/health": new Response("ok"),
    "/todos": {
      GET: () => Response.json(todos),
      POST: async (req) => Response.json(await req.json(), { status: 201 }),
    },
    "/todos/:id": (req) => Response.json(todos[Number(req.params.id)]),
  },
  fetch: () => new Response("Not Found", { status: 404 }), // fallback
});
server.stop();
```

## WebSockets — `/docs/runtime/http/websockets`

```ts
Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req, { data: { user: "anon" } })) return;
    return new Response("Upgrade required", { status: 426 });
  },
  websocket: {
    open(ws) { ws.subscribe("chat"); },
    message(ws, msg) { ws.publish("chat", msg); }, // ws.publish skips the sender; server.publish reaches all
    close(ws) { ws.unsubscribe("chat"); },
  },
});
```

## Cookies — `/docs/runtime/http/cookies`

```ts
Bun.serve({
  routes: {
    "/": (req) => {
      let id = req.cookies.get("session");
      if (!id) req.cookies.set("session", (id = crypto.randomUUID()), { httpOnly: true, path: "/" });
      return new Response(id); // cookies set on req.cookies are sent automatically
    },
  },
});
const jar = new Bun.CookieMap("a=1; b=2"); // outside Bun.serve
```

## Hashing — `/docs/runtime/hashing`

```ts
const hash = await Bun.password.hash(password); // argon2id by default
const ok = await Bun.password.verify(password, hash);
Bun.hash("data"); // fast non-crypto hash
new Bun.CryptoHasher("sha256").update("data").digest("hex");
```

## Env vars — `/docs/runtime/environment-variables`

```ts
// .env, .env.local, .env.<NODE_ENV> load automatically
const apiKey = Bun.env.API_KEY; // same object as process.env
```

## YAML / TOML / JSON5 — `/docs/runtime/yaml`

```ts
const config = Bun.YAML.parse(await Bun.file("config.yaml").text());
import config2 from "./config.yaml"; // or import the file directly (also .toml, .json5)
Bun.TOML.parse(text);
```

## Semver — `/docs/runtime/semver`

```ts
Bun.semver.satisfies(Bun.version, ">=1.4.0"); // boolean
Bun.semver.order("1.0.0", "1.1.0"); // -1 | 0 | 1
```

## Secrets — `/docs/runtime/secrets`

```ts
import { secrets } from "bun"; // OS keychain
await secrets.set({ service: "my-cli", name: "github-token", value: token });
const token = await secrets.get({ service: "my-cli", name: "github-token" }); // string | null
await secrets.delete({ service: "my-cli", name: "github-token" });
```

## Module paths — `/docs/runtime/module-resolution`

```ts
import.meta.dir;  // directory of this file (__dirname)
import.meta.path; // absolute path of this file (__filename)
if (import.meta.main) { /* run only when executed directly */ }
```

## Utils — `/docs/runtime/utils`

```ts
await Bun.sleep(1000);
Bun.deepEquals(a, b);
```

## Tests — `/docs/test/index`

```ts
import { test, expect, describe, mock, beforeEach } from "bun:test";
test("sum", () => expect(sum([1, 2])).toBe(3));
```

Run with `bun test` (finds `*.test.ts`, `*.spec.ts`), `bun test --watch`, `bun test -t name`.

## Bundling — `/docs/bundler/index`

```sh
bun build src/index.ts --outdir dist --target browser --minify
bun build src/cli.ts --compile --outfile app # single-file executable
```

```ts
await Bun.build({ entrypoints: ["src/index.ts"], outdir: "dist", target: "browser", minify: true });
```

## Dev tools

| Job | Command |
| --- | --- |
| Run TS, restart on change | `bun --watch src/index.ts` (`--hot` reloads in place) |
| Install / add / run a binary | `bun install`, `bun add zod`, `bun add -d @types/bun`, `bunx <pkg>` |
| Package metadata (`npm view`) | `bun info zod`, `bun info zod version` |
| Format | `bun fmt`, `bun fmt --check` — `/docs/format` |
| Lint | `bun lint`, `bun lint --fix` — `/docs/lint` |
| Type check | `bun check`, `bun check src/index.ts` — `/docs/runtime/check` |
