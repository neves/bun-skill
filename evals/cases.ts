// Each case is a task a Node-habituated agent would solve the old way.
// `expect` patterns must all match; `forbid` patterns must not match.
// `cmd` checks run against Bash commands, `code` against new/modified files.

export type Case = {
  id: string;
  prompt: string;
  files?: Record<string, string>;
  requires?: string; // bun subcommand that must exist locally, else the case is skipped
  expect: { cmd?: RegExp[]; code?: RegExp[]; anyOf?: { cmd?: RegExp[]; code?: RegExp[] } };
  forbid: { cmd?: RegExp[]; code?: RegExp[] };
};

const NO_RUN = "No server is available, so write the code but do not execute it.";
// Matches running a tool (directly or via npx/bunx/bun x/npm exec), not mentioning it in grep/ls.
const runs = (tools: string) =>
  new RegExp(`(^|[;&|(]\\s*|\\b(npx|bunx|bun x|npm exec|pnpm|yarn)\\s+)(${tools})\\b`, "m");
const fromBun = (names: string) => new RegExp(`import\\s*\\{[^}]*\\b(${names})\\b[^}]*\\}\\s*from\\s*["']bun["']`);

export const cases: Case[] = [
  {
    id: "fmt",
    prompt: "Format src/messy.ts.",
    files: { "src/messy.ts": `export   const  add=(a:number,b :number)=>{return a+b}\nconst x = {a:1,\n  b:2}\n` },
    expect: { cmd: [/\bbun\s+fmt\b/] },
    forbid: { cmd: [runs("prettier|biome|dprint")] },
  },
  {
    id: "lint",
    prompt: "Lint the project and report the problems you find.",
    requires: "lint",
    files: { "src/cart.ts": `export function total(p: number[]) {\n  let s = 0;\n  for (let i = 0; i < p.length; i--) s += p[i];\n  return s;\n}\n` },
    expect: { cmd: [/\bbun\s+lint\b/] },
    forbid: { cmd: [runs("eslint|oxlint|biome")] },
  },
  {
    id: "check",
    prompt: "Type check the project and tell me the errors.",
    files: { "src/bad.ts": `export const n: number = "not a number";\n` },
    expect: { cmd: [/\bbun\s+check\b/] },
    forbid: { cmd: [runs("tsc")] },
  },
  {
    id: "test",
    prompt: "Write unit tests for src/sum.ts and run them.",
    files: { "src/sum.ts": `export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);\n` },
    expect: { cmd: [/\bbun\s+test\b/], code: [/from\s*["']bun:test["']/] },
    forbid: { cmd: [runs("jest|vitest")], code: [/from\s*["'](vitest|@jest\/globals|jest)["']/] },
  },
  {
    id: "shell",
    prompt: "Write scripts/clean-branches.ts that deletes local git branches already merged into main.",
    expect: { anyOf: { code: [/\bBun\.\$/, /import\s*\{[^}]*\$[^}]*\}\s*from\s*["']bun["']/] } },
    forbid: { code: [/child_process|execa|["']zx["']/] },
  },
  {
    id: "spawn",
    prompt: "Write scripts/dev.ts that starts `bun server.ts` as a child process, streams its stdout, and restarts it whenever it exits with a non-zero code.",
    expect: { code: [/\bspawn\b/] },
    forbid: { code: [/child_process|execa/] },
  },
  {
    id: "sqlite",
    prompt: "Create src/db.ts: a small todo store backed by a local SQLite file, with add, list and complete functions.",
    expect: { code: [/["']bun:sqlite["']/] },
    forbid: { code: [/better-sqlite3|["']sqlite3?["']|node:sqlite/] },
  },
  {
    id: "postgres",
    prompt: `Create src/users.ts with functions to insert and fetch users from Postgres via DATABASE_URL. ${NO_RUN}`,
    expect: { anyOf: { code: [fromBun("sql|SQL"), /\bBun\.(sql|SQL)\b/] } },
    forbid: { code: [/from\s*["'](pg|postgres|knex|drizzle-orm[^"']*|@prisma\/client)["']/] },
  },
  {
    id: "redis",
    prompt: `Create src/cache.ts: a get/set cache with TTL backed by Redis via REDIS_URL. ${NO_RUN}`,
    expect: { anyOf: { code: [fromBun("redis|RedisClient"), /\bBun\.redis\b/] } },
    forbid: { code: [/from\s*["'](ioredis|redis|@redis\/[^"']+)["']/] },
  },
  {
    id: "s3",
    prompt: `Create src/upload.ts that uploads a local file to an S3 bucket and returns a presigned download URL. ${NO_RUN}`,
    expect: { anyOf: { code: [fromBun("s3|S3Client"), /\bBun\.(s3|S3Client)\b/] } },
    forbid: { code: [/@aws-sdk/] },
  },
  {
    id: "http",
    prompt: "Create server.ts: a JSON HTTP API with GET /health and GET/POST /todos kept in memory.",
    expect: { code: [/\bBun\.serve\b|\bserve\(/, /routes/] },
    forbid: { code: [/from\s*["'](express|fastify|hono|koa|node:http|http)["']/] },
  },
  {
    id: "websocket",
    prompt: "Create chat.ts: a WebSocket chat server that broadcasts every message to all connected clients.",
    expect: { code: [/\bBun\.serve\b|\bserve\(/, /websocket/] },
    forbid: { code: [/from\s*["'](ws|socket\.io)["']/] },
  },
  {
    id: "cookies",
    prompt: "Create server.ts: an HTTP server that reads a `session` cookie and sets one with a random id when it is missing.",
    expect: { anyOf: { code: [/\.cookies\b/, /CookieMap/] } },
    forbid: { code: [/cookie-parser|from\s*["']cookie["']/] },
  },
  {
    id: "password",
    prompt: "Add src/auth.ts with hashPassword and verifyPassword functions for storing user passwords.",
    expect: { code: [/\bBun\.password\b|\bpassword\.(hash|verify)/] },
    forbid: { code: [/from\s*["'](bcrypt|bcryptjs|argon2|@node-rs\/[^"']+)["']|\b(scrypt|pbkdf2)(Sync)?\(/] },
  },
  {
    id: "files",
    prompt: "Write scripts/bump.ts that reads package.json, increments the patch version, and writes it back.",
    expect: { code: [/\bBun\.file\b/, /\bBun\.write\b/] },
    forbid: { code: [/readFile|writeFile/] },
  },
  {
    id: "glob",
    prompt: "Write scripts/count-lines.ts that prints the total number of lines across all .ts files under src/, recursively.",
    files: { "src/a.ts": "export const a = 1;\n", "src/nested/b.ts": "export const b = 2;\n" },
    expect: { code: [/\bGlob\b/] },
    forbid: { code: [/from\s*["'](glob|fast-glob|globby)["']|readdir/] },
  },
  {
    id: "env",
    prompt: "Create src/config.ts that loads API_KEY and PORT from the .env file and exports them typed.",
    files: { ".env": "API_KEY=secret\nPORT=3000\n" },
    expect: { code: [/\bBun\.env\b|process\.env|import\.meta\.env/] },
    forbid: { code: [/from\s*["']dotenv|require\(["']dotenv|dotenv\/config/] },
  },
  {
    id: "yaml",
    prompt: "Write scripts/read-config.ts that loads config.yaml and prints the server.port value.",
    files: { "config.yaml": "server:\n  port: 8080\n" },
    expect: { anyOf: { code: [/\bYAML\b/, /from\s*["'][^"']*\.ya?ml["']/] } },
    forbid: { code: [/js-yaml|from\s*["']yaml["']/] },
  },
  {
    id: "semver",
    prompt: "Write scripts/check-engine.ts: exit with code 1 when the running Bun version does not satisfy the engines.bun range in package.json.",
    expect: { code: [/\bsemver\.satisfies\b/] },
    forbid: { code: [/from\s*["']semver["']/] },
  },
  {
    id: "secrets",
    prompt: "Write scripts/token.ts that stores a GitHub token in the OS keychain and reads it back.",
    expect: { code: [/\bsecrets\.(set|get)\b/] },
    forbid: { code: [/keytar|security add-generic-password|secret-tool/] },
  },
  {
    id: "paths",
    prompt: "Write scripts/where.ts that prints the absolute path of its own directory, but only when run directly, not when imported.",
    expect: { code: [/import\.meta\.dir/, /import\.meta\.main/] },
    forbid: { code: [/__dirname|fileURLToPath|require\.main/] },
  },
  {
    id: "watch",
    prompt: "Add a `dev` script to package.json that runs src/index.ts and restarts on file changes.",
    files: { "src/index.ts": `console.log("hi");\n` },
    expect: { code: [/"dev"\s*:\s*"bun[^"]*--(watch|hot)/] },
    forbid: { code: [/nodemon|\btsx\b|ts-node/] },
  },
  {
    id: "bundle",
    prompt: "Bundle src/index.ts into a single minified file in dist/ for the browser.",
    files: { "src/index.ts": `document.body.textContent = "hi";\n` },
    expect: { anyOf: { cmd: [/\bbun\s+build\b/], code: [/\bBun\.build\b/] } },
    forbid: { cmd: [runs("esbuild|webpack|rollup|vite|tsup")], code: [/esbuild|webpack|rollup|vite|tsup/] },
  },
  {
    id: "fullstack",
    prompt: "Create a React todo app with a dev server: index.html, a React frontend in src/App.tsx, and a /api/todos endpoint, served from one server.ts.",
    expect: { code: [/from\s*["'][^"']*\.html["']/] },
    forbid: { cmd: [runs("vite|webpack|parcel")], code: [/from\s*["'](vite|express|@vitejs\/[^"']+)["']/] },
  },
  {
    id: "cron",
    prompt: "Write scripts/cleanup.ts that deletes files older than 7 days in ./tmp every hour while the process runs.",
    expect: { code: [/\bcron\(/] },
    forbid: { code: [/from\s*["'](node-cron|cron|node-schedule|croner)["']|setInterval/] },
  },
  {
    id: "image",
    prompt: "Write scripts/thumbs.ts that turns every .jpg in images/ into a 200x200 WebP thumbnail in thumbs/.",
    expect: { code: [/\.image\(\)|\bBun\.Image\b|new Image\(/] },
    forbid: { code: [/from\s*["'](sharp|jimp|canvas)["']/] },
  },
  {
    id: "webview",
    prompt: `Write scripts/screenshot.ts that opens https://example.com in a headless browser, prints the page title and saves a screenshot to page.png. ${NO_RUN}`,
    expect: { code: [/\bWebView\b/] },
    forbid: { code: [/puppeteer|playwright|selenium/] },
  },
  {
    id: "markdown",
    prompt: "Write scripts/build-docs.ts that converts every .md file in docs/ to an .html file in site/.",
    files: { "docs/intro.md": "# Intro\n\nHello **world**.\n" },
    expect: { code: [/\bmarkdown\.(html|render|react)\b/] },
    forbid: { code: [/from\s*["'](marked|markdown-it|remark|showdown|micromark)["']/] },
  },
  {
    id: "xml",
    prompt: "Write scripts/feed.ts that parses feed.xml and prints the title of every <item>.",
    files: { "feed.xml": "<rss><channel><item><title>A</title></item><item><title>B</title></item></channel></rss>\n" },
    expect: { code: [/\bXML\.parse\b/] },
    forbid: { code: [/fast-xml-parser|xml2js|xmldom|sax/] },
  },
  {
    id: "mocks",
    prompt: "src/greet.ts calls fetchName() from src/api.ts. Write a test for greet that mocks fetchName, then run it.",
    files: {
      "src/api.ts": `export async function fetchName(id: number): Promise<string> {\n  const res = await fetch(\`https://example.com/users/\${id}\`);\n  return (await res.json()).name;\n}\n`,
      "src/greet.ts": `import { fetchName } from "./api";\nexport async function greet(id: number) {\n  return \`Hello, \${await fetchName(id)}!\`;\n}\n`,
    },
    expect: { code: [/from\s*["']bun:test["']/, /mock\.module|spyOn|\bmock\(/] },
    forbid: { code: [/from\s*["'](vitest|sinon|jest-mock|@jest\/globals)["']|jest\.mock/] },
  },
  {
    id: "compile",
    prompt: "Package src/cli.ts as a standalone executable named mycli that runs without Bun installed.",
    files: { "src/cli.ts": `console.log("hello from cli", process.argv.slice(2));\n` },
    expect: { anyOf: { cmd: [/\bbun\s+build\b[^\n]*--compile/], code: [/--compile|compile:\s*/] } },
    forbid: { cmd: [runs("pkg|nexe")], code: [/["'](pkg|nexe|@yao-pkg\/pkg)["']/] },
  },
  {
    id: "utils",
    prompt: "Write src/text.ts exporting stripColors(s) that removes ANSI color codes, and newId() that returns a new UUID suitable as a sortable database key.",
    expect: { code: [/\bstripANSI\b/, /\brandomUUIDv7\b/] },
    forbid: { code: [/from\s*["'](strip-ansi|uuid|nanoid|ulid)["']/] },
  },
  {
    id: "parallel",
    prompt: "Add a `dev` script to package.json that runs the existing dev:api and dev:web scripts at the same time.",
    files: { "package.json": JSON.stringify({ name: "app", type: "module", scripts: { "dev:api": "bun --watch api.ts", "dev:web": "bun ./index.html" } }, null, 2) },
    expect: { code: [/"dev"\s*:\s*"bun (run )?--parallel/] },
    forbid: { code: [/concurrently|npm-run-all|run-p\b|&\s*bun/] },
  },
  {
    id: "static",
    prompt: "Create server.ts that serves the files in ./public at /assets/ and a JSON /api/health endpoint.",
    files: { "public/style.css": "body { color: red; }\n" },
    expect: { code: [/["'`][^"'`]*\/\*["'`]\s*:\s*\{\s*dir\s*:/] },
    forbid: { code: [/from\s*["'](express|serve-static|sirv|serve-handler)["']/] },
  },
  {
    id: "download",
    prompt: `Write scripts/download.ts that downloads a large file from a URL given as the first argument and saves it to disk without loading it all into memory. ${NO_RUN}`,
    expect: { code: [/Bun\.write\([^)]*fetch|Bun\.write\(\s*\w+\s*,\s*(res|response|resp)\b/] },
    forbid: { code: [/createWriteStream|pipeline|from\s*["'](got|axios|node-fetch)["']/] },
  },
  {
    id: "pty",
    prompt: "Write scripts/pty.ts that runs an interactive bash in a pseudo-terminal, sends it `ls --color`, and prints the colored output.",
    expect: { code: [/terminal\s*:/] },
    forbid: { code: [/node-pty|@lydell\/node-pty|\bscript -q/] },
  },
  {
    id: "faketimers",
    prompt: "src/debounce.ts exports debounce(fn, ms). Write a test that checks fn runs once after 300ms without actually waiting, then run it.",
    files: { "src/debounce.ts": `export function debounce<T extends unknown[]>(fn: (...a: T) => void, ms: number) {\n  let t: ReturnType<typeof setTimeout> | undefined;\n  return (...a: T) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };\n}\n` },
    expect: { code: [/useFakeTimers/, /from\s*["']bun:test["']/] },
    forbid: { code: [/from\s*["'](sinon|@sinonjs\/fake-timers|vitest)["']/] },
  },
  {
    id: "archive",
    prompt: "Write scripts/backup.ts that packs the src/ folder into backup.tar.gz.",
    files: { "src/a.ts": "export const a = 1;\n" },
    expect: { code: [/\bArchive\b/] },
    forbid: { code: [/from\s*["'](tar|archiver|tar-stream)["']|\$`tar /] },
  },
  {
    id: "compress",
    prompt: "Write scripts/gzip-logs.ts that gzips every .log file in logs/ next to the original.",
    files: { "logs/app.log": "line 1\nline 2\n" },
    expect: { code: [/gzipSync|CompressionStream/] },
    forbid: { code: [/from\s*["'](pako|node:zlib|zlib|fflate)["']/] },
  },
  {
    id: "urlpattern",
    prompt: "Write src/match.ts exporting matchUserRoute(url) that returns the id from paths like /users/:id, or null.",
    expect: { code: [/\bURLPattern\b/] },
    forbid: { code: [/path-to-regexp|from\s*["']regexparam["']/] },
  },
  {
    id: "fetchsession",
    prompt: `Write src/client.ts: an HTTP client for https://api.internal that trusts the CA in certs/ca.pem, goes through the proxy in HTTPS_PROXY, and reuses connections. ${NO_RUN}`,
    expect: { anyOf: { code: [/FetchSession/, /fetch\([^)]*\{[^}]*(proxy|tls)\s*:/s] } },
    forbid: { code: [/from\s*["'](undici|https-proxy-agent|axios|got|node-fetch|global-agent)["']/] },
  },
  {
    id: "jsonc",
    prompt: "Write scripts/strict.ts that reads tsconfig.json (it has comments) and prints whether compilerOptions.strict is on.",
    files: { "tsconfig.json": `{\n  // project settings\n  "compilerOptions": { "strict": true, },\n}\n` },
    expect: { anyOf: { code: [/JSONC/, /from\s*["'][^"']*tsconfig\.json["']/] } },
    forbid: { code: [/jsonc-parser|strip-json-comments|json5["']|typescript["']/] },
  },
  {
    id: "temporal",
    prompt: "Write src/dates.ts exporting nextBusinessDay(date: string) that returns the next weekday as YYYY-MM-DD.",
    expect: { code: [/\bTemporal\./] },
    forbid: { code: [/from\s*["'](moment|dayjs|date-fns|luxon)["']/] },
  },
  {
    id: "profile",
    prompt: "src/slow.ts is slow. Profile it to find the hot function and tell me which one it is.",
    files: { "src/slow.ts": `function fib(n: number): number { return n < 2 ? n : fib(n - 1) + fib(n - 2); }\nfunction fast() { return 1; }\nconsole.log(fib(32), fast());\n` },
    expect: { cmd: [/--cpu-prof/] },
    forbid: { cmd: [runs("0x|clinic|node --prof")] },
  },
  {
    id: "stdin",
    prompt: "Write scripts/wc.ts that prints the number of words piped into it on stdin.",
    expect: { code: [/Bun\.stdin|of console\b/] },
    forbid: { code: [/readline|process\.stdin|get-stdin/] },
  },
  {
    id: "argv",
    prompt: "Write scripts/resize.ts: a CLI that takes input files as positional args plus --width/-w (number, default 800), --out/-o (directory) and --verbose flags, and prints the parsed options.",
    expect: { code: [/import\s*\{[^}]*\bparseArgs\b[^}]*\}\s*from\s*["'](node:)?util["']/] },
    forbid: { code: [/from\s*["'](yargs|commander|minimist|meow|arg|cac)["']/] },
  },
  {
    id: "tcp",
    prompt: "Write tcp-echo.ts: a TCP echo server on port 9000.",
    expect: { code: [/\bBun\.listen\b|\blisten\(\s*\{/] },
    forbid: { code: [/from\s*["'](node:)?net["']/] },
  },
  {
    id: "csrf",
    prompt: "Create server.ts with CSRF protection: GET /form returns an HTML form carrying a token, POST /submit rejects requests without a valid token.",
    expect: { code: [/CSRF\.(generate|verify)/] },
    forbid: { code: [/csurf|csrf-csrf|from\s*["']csrf["']/] },
  },
  {
    id: "coverage",
    prompt: "Run the tests with a code coverage report and tell me the uncovered lines.",
    files: {
      "src/math.ts": `export const sum = (a: number, b: number) => a + b;\nexport const div = (a: number, b: number) => {\n  if (b === 0) throw new Error("div by zero");\n  return a / b;\n};\n`,
      "src/math.test.ts": `import { test, expect } from "bun:test";\nimport { sum } from "./math";\ntest("sum", () => expect(sum(1, 2)).toBe(3));\n`,
    },
    expect: { cmd: [/\bbun\s+test\b[^\n]*--coverage/] },
    forbid: { cmd: [runs("c8|nyc|jest|vitest")] },
  },
  {
    id: "ci",
    prompt: "Write .github/workflows/ci.yml that installs dependencies reproducibly from the lockfile and runs the tests split across 3 parallel jobs.",
    expect: { code: [/bun install --frozen-lockfile|bun ci\b/, /--shard/] },
    forbid: { code: [/npm (ci|install)|yarn|pnpm|setup-node/] },
  },
  {
    id: "envfile",
    prompt: "Add a `start:prod` script to package.json that runs server.ts with the variables from .env.production.",
    files: { "server.ts": `console.log(Bun.env.PORT);\n`, ".env.production": "PORT=80\n" },
    expect: { code: [/"start:prod"\s*:\s*"bun[^"]*--env-file/] },
    forbid: { code: [/dotenv|env-cmd|cross-env/] },
  },
  {
    id: "patch",
    prompt: "Install the is-odd package, then patch it persistently so isOdd(1.5) returns false instead of throwing, and the change survives reinstalls.",
    expect: { cmd: [/\bbun\s+patch\b/] },
    forbid: { cmd: [runs("patch-package")], code: [/patch-package/] },
  },
  {
    id: "scaffold",
    prompt: "Set up a new React + Tailwind project in this folder.",
    expect: { cmd: [/\bbun\s+(init|create)\b/] },
    forbid: { cmd: [runs("npm|create-vite|create-react-app")] },
  },
  {
    id: "transpile",
    prompt: "Write scripts/strip-types.ts that converts each .ts file in src/ to a .js file in out/, one file per input, without bundling.",
    files: { "src/a.ts": "export const a: number = 1;\n", "src/b.ts": "import { a } from './a';\nexport const b: number = a + 1;\n" },
    expect: { anyOf: { code: [/\bTranspiler\b/, /--no-bundle|packages:\s*["']external|Bun\.build/] } },
    forbid: { code: [/from\s*["'](typescript|@babel\/[^"']+|esbuild|sucrase|@swc\/[^"']+)["']/] },
  },
  {
    id: "htmlcolor",
    prompt: "Write src/fmt.ts exporting escape(s) that HTML-escapes a string, and orange(s) that wraps text in a 24-bit orange terminal color.",
    expect: { code: [/\bescapeHTML\b/, /\bcolor\(/] },
    forbid: { code: [/from\s*["'](escape-html|he|chalk|picocolors|kleur|ansi-styles)["']/] },
  },
  {
    id: "using",
    prompt: "Write scripts/smoke.ts that starts server.ts as a child process, fetches http://localhost:3000/health, and guarantees the child is killed even if the fetch throws.",
    files: { "server.ts": `Bun.serve({ port: 3000, routes: { "/health": new Response("ok") } });\n` },
    expect: { anyOf: { code: [/\bawait using\b|\busing\s+\w+\s*=/, /finally\s*\{[^}]*\.kill\(/] } },
    forbid: { code: [/child_process|execa/] },
  },
  {
    id: "analyze",
    prompt: "Bundle src/index.ts for the browser and tell me which modules take up the most space in the output.",
    files: { "src/index.ts": `import { big } from "./big";\nimport { small } from "./small";\nconsole.log(big.length, small);\n`, "src/big.ts": `export const big = "${"x".repeat(20000)}";\n`, "src/small.ts": `export const small = 1;\n` },
    expect: { anyOf: { cmd: [/--metafile/], code: [/metafile/] } },
    forbid: { cmd: [runs("webpack-bundle-analyzer|source-map-explorer|esbuild")] },
  },
  {
    id: "install",
    prompt: "Add zod as a dependency.",
    expect: { cmd: [/\bbun\s+(add|install|i)\b/] },
    forbid: { cmd: [runs("npm|pnpm|yarn|npx")] },
  },
];
