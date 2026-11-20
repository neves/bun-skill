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
    id: "install",
    prompt: "Add zod as a dependency.",
    expect: { cmd: [/\bbun\s+(add|install|i)\b/] },
    forbid: { cmd: [runs("npm|pnpm|yarn|npx")] },
  },
];
