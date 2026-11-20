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

Pseudo-terminal (instead of `node-pty`):

```ts
const proc = Bun.spawn(["bash"], {
  terminal: { cols: 80, rows: 24, data(term, data) { process.stdout.write(data); } },
});
proc.terminal.write("echo hello\n");
proc.terminal.resize(120, 40);
await proc.exited;
proc.terminal.close();
```

## Stdin and prompts — `/docs/runtime/console`

```ts
const input = await Bun.stdin.text(); // whole stdin; also .json(), .stream()
for await (const line of console) { /* one line of stdin at a time */ }
const name = prompt("Name?"); // synchronous, string | null
```

## TCP — `/docs/runtime/networking/tcp`

```ts
const server = Bun.listen({
  hostname: "127.0.0.1", port: 9000,
  socket: { data(socket, data) { socket.write(data); }, open(socket) {}, close(socket) {} },
});
await Bun.connect({
  hostname: "127.0.0.1", port: 9000,
  socket: { open(socket) { socket.write("ping"); }, data(socket, data) { console.log(data.toString()); socket.end(); } },
});
```

## Files — `/docs/runtime/file-io`

```ts
const pkg = await Bun.file("package.json").json(); // also .text() .bytes() .stream() .exists()
await Bun.write("package.json", JSON.stringify(pkg, null, 2) + "\n");
await Bun.write("copy.png", Bun.file("logo.png"));
await Bun.write("big.tar.gz", await fetch(url)); // streams the download to disk; also takes a ReadableStream
import { mkdir, readdir, rm } from "node:fs/promises"; // directories: node:fs is Bun's recommendation
```

## Archives — `/docs/runtime/archive`

```ts
const archive = new Bun.Archive({ "README.md": "# hi", "src/index.ts": code }, { compress: "gzip" });
await Bun.write("out.tar.gz", archive);
const extracted = new Bun.Archive(await Bun.file("pkg.tar.gz").bytes());
await extracted.extract("./output"); // entry count
for (const [path, file] of await extracted.files()) console.log(path, await file.text());
```

## Compression — `/docs/runtime/utils`

```ts
const gz = Bun.gzipSync(data); // Uint8Array; Bun.gunzipSync(gz) to reverse
Bun.zstdCompressSync(data); Bun.zstdDecompressSync(z); Bun.deflateSync(data); // also async zstdCompress
const body = Bun.file("log.txt").stream().pipeThrough(new CompressionStream("gzip")); // also "brotli", "zstd", "deflate"
await Bun.write("log.txt.gz", new Response(body));
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
const users = await sql<User[]>`SELECT * FROM users WHERE id = ${id}`; // parameterized; <T> types the rows
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
  "/static/*": { dir: "./public" }, // static folder: Content-Type, ETag, Range, index.html handled
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

## CSRF — `/docs/runtime/csrf`

```ts
const secret = Bun.env.CSRF_SECRET; // omit both secrets to use a per-process random one
const token = Bun.CSRF.generate(secret, { sessionId, expiresIn: 60 * 60 * 1000 }); // string; default 24h
const ok = Bun.CSRF.verify(token, { secret, sessionId }); // boolean; sessionId must match generate()

Bun.serve({
  routes: {
    "/form": () => new Response(`<form method="post" action="/submit"><input type="hidden" name="csrf" value="${Bun.CSRF.generate(secret)}"><button>Send</button></form>`, { headers: { "Content-Type": "text/html" } }),
    "/submit": { POST: async (req) => {
      const token = String((await req.formData()).get("csrf") ?? req.headers.get("x-csrf-token") ?? "");
      return Bun.CSRF.verify(token, { secret }) ? new Response("ok") : new Response("Forbidden", { status: 403 });
    } },
  },
});
```

## URL matching — standard `URLPattern`

```ts
const route = new URLPattern({ pathname: "/users/:id" });
route.test(url); // boolean
route.exec(url)?.pathname.groups.id; // "42"
```

## HTTP client sessions — `/docs/runtime/networking/fetch`

```ts
await fetch(url, { proxy: "http://proxy:8080", tls: { rejectUnauthorized: false } }); // per request
using session = new Bun.FetchSession({ // own TLS, proxy and keep-alive pool
  tls: { ca: await Bun.file("corp-ca.pem").text() },
  proxy: { url: "http://proxy.internal:8080" },
  keepAlive: { idleTimeout: 30, maxIdleSockets: 8 },
});
const res = await session.fetch("https://api.example.com"); // session.fetch is bound: new Client({ fetch: session.fetch })
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

```sh
bun --env-file=.env.prod server.ts # load specific files (repeatable); --no-env-file skips .env
```

## YAML / TOML / JSON5 / JSONC / JSONL — `/docs/runtime/yaml`, `/docs/runtime/jsonl`

```ts
const config = Bun.YAML.parse(await Bun.file("config.yaml").text());
import config2 from "./config.yaml"; // or import the file directly (also .toml, .json5)
Bun.TOML.parse(text);
Bun.JSONC.parse(text); // comments and trailing commas, like tsconfig.json
Bun.JSONL.parse(ndjson); // array of records; Bun.JSONL.parseChunk for streams
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
Bun.stripANSI("\x1b[31mred\x1b[0m"); // "red"
Bun.stringWidth("日本"); // 4 — display columns, ANSI and emoji aware
Bun.wrapAnsi(text, 80);
Bun.sliceAnsi(text, 0, 20); // column-aware slice that keeps colors (truncate with it)
Bun.randomUUIDv7(); // time-ordered, good for DB keys; crypto.randomUUID() for v4
Bun.which("git"); // absolute path or null
Bun.escapeHTML(`<a href="x">`); // &lt;a href=&quot;x&quot;&gt;
Bun.color("#ff8800", "ansi-16m"); // "\x1b[38;2;255;136;0m" — "ansi" auto-detects and returns "" when piped
Bun.color("red", "hex"); // "#ff0000"; also "css", "rgb", "number", "ansi-256", "ansi-16"
```

## Dates and times — standard `Temporal`

```ts
const today = Temporal.Now.plainDateISO();
today.add({ days: 7 }).toString(); // "2026-11-26"
Temporal.Instant.from("2026-01-01T00:00:00Z").toZonedDateTimeISO("America/Sao_Paulo");
Temporal.Duration.from({ hours: 2 }).total("minutes"); // 120
```

## Cleanup — standard `using`

```ts
await using proc = Bun.spawn(["bun", "server.ts"]); // killed and awaited at scope exit
using spy = spyOn(api, "fetchUser"); // restored at scope exit
await using view = new Bun.WebView(); // also Bun.FetchSession
```

## Cron — `/docs/runtime/cron`

```ts
const job = Bun.cron("*/5 * * * *", async () => { await sync(); }); // in-process
job.stop();
Bun.cron("0 9 * * *", report, { tz: "America/New_York" });
const next = Bun.cron.parse("30 9 * * MON-FRI"); // next matching Date
await Bun.cron("./worker.ts", "30 2 * * MON", "weekly-report"); // OS-level job, survives reboot
```

## Images — `/docs/runtime/image`

```ts
await Bun.file("photo.jpg").image().resize(400, 400, { fit: "inside" }).webp({ quality: 80 }).write("thumb.webp");
// fit: "fill" (default, stretch to exact size) or "inside" (keep aspect ratio, fit within the box) — the full set.
// Bun.Image has no crop/cover step: for a square thumbnail use resize(200, 200) (stretch) or { fit: "inside" } (letterbox-free, may be smaller on one side).
img.resize(800); // width only, keeps aspect ratio
img.rotate(90).flip(); // also .flop(), .modulate({ brightness })
const { width, height, format } = await new Bun.Image("photo.jpg").metadata();
const png = await new Bun.Image(bytes, { maxPixels: 4096 * 4096 }).png().bytes(); // untrusted input: pass bytes, cap pixels
```

## Browser automation — `/docs/runtime/webview`

```ts
await using view = new Bun.WebView({ width: 1280, height: 720 }); // closes automatically
await view.navigate("https://example.com");
await view.click("a[href]"); // waits until clickable
const title = await view.evaluate("document.title");
await Bun.write("page.png", await view.screenshot());
```

## Markdown — `/docs/runtime/markdown`

```ts
const html = Bun.markdown.html("# Hello **world**"); // GFM tables, strikethrough, task lists on by default
Bun.markdown.html(md, { autolinks: true, headings: true });
```

## XML — `/docs/runtime/xml`

```ts
import { XML } from "bun";
const data = XML.parse(`<order id="A1"><item sku="tea">Tea</item></order>`);
// { order: { "@id": "A1", item: { "@sku": "tea", "#text": "Tea" } } } — all values are strings
const xml = XML.stringify(data, null, 2);
```

## Tests — `/docs/test`

```ts
import { test, expect, describe, mock, beforeEach } from "bun:test";
test("sum", () => expect(sum([1, 2])).toBe(3));
```

```ts
const fn = mock((x: number) => x * 2); // fn.mock.calls, .mockReturnValue(), .mockResolvedValue()
const spy = spyOn(api, "fetchUser"); // tracks calls, keeps the original
mock.module("./db", () => ({ query: mock(() => []) })); // replaces a module for importers
jest.useFakeTimers(); jest.advanceTimersByTime(1000); jest.useRealTimers(); // `jest` from "bun:test"
setSystemTime(new Date("2026-01-01")); // freeze Date.now()
```

Run with `bun test` (finds `*.test.ts`, `*.spec.ts`), `bun test --watch`, `bun test -t name`. Mocks: `/docs/test/mocks`.

```sh
bun test --coverage                       # text table; --coverage-reporter=lcov writes coverage/lcov.info
bun test --shard=1/3 --parallel           # CI: split across jobs, run files in worker processes
bun test --changed=main --retry=2         # only files affected by changes vs main; retry flaky tests
```

## Frontend / full-stack — `/docs/bundler/fullstack`

```sh
bun ./index.html # dev server: bundles <script>/<link> tags, TS/JSX/CSS, hot reload
```

```ts
import homepage from "./index.html";
Bun.serve({
  routes: { "/": homepage, "/api/todos": { GET: () => Response.json(todos) } },
  development: true, // detailed errors + hot reload
});
```

## Bundling — `/docs/bundler`

```sh
bun build src/index.ts --outdir dist --target browser --minify
bun build src/cli.ts --compile --outfile app # single-file executable — `/docs/compiler/executables`
bun build src/index.ts --outdir dist --metafile-md=meta.md # Markdown module-graph report to read
```

```ts
await Bun.build({ entrypoints: ["src/index.ts"], outdir: "dist", target: "browser", minify: true });
const js = new Bun.Transpiler({ loader: "tsx" }).transformSync(code); // TS/JSX → JS string, no bundling
```

## Dev tools

| Job | Command |
| --- | --- |
| Run TS, restart on change | `bun --watch src/index.ts` (`--hot` reloads in place) |
| Run scripts together | `bun run --parallel dev:api dev:web`, `bun run --parallel "build:*"`, `--sequential`, `--filter '*'`, `--no-exit-on-error` |
| Profile | `bun --cpu-prof-md app.ts`, `bun --heap-prof-md app.ts` — Markdown reports to read; `/docs/project/benchmarking` |
| Install / add / run a binary | `bun install`, `bun add zod`, `bun add -d @types/bun`, `bunx <pkg>` |
| Package metadata (`npm view`) | `bun info zod`, `bun info zod version` |
| Version bump, licenses, audit | `bun pm version patch`, `bun pm licenses`, `bun audit fix` |
| CI install, updates, publish | `bun install --frozen-lockfile`, `bun update -i` (`--latest`), `bun publish` |
| Patch a dependency | `bun patch zod` → edit `node_modules/zod` → `bun patch --commit zod` (writes `patches/`) |
| New project | `bun init -y`, `bun init --react` (`=tailwind`, `=shadcn`), `bun create <template>` |
| Format | `bun fmt`, `bun fmt --check` — `/docs/format` |
| Lint | `bun lint`, `bun lint --fix` — `/docs/lint` |
| Type check | `bun check`, `bun check src/index.ts` — `/docs/runtime/check` |
