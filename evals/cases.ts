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
    id: "install",
    prompt: "Add zod as a dependency.",
    expect: { cmd: [/\bbun\s+(add|install|i)\b/] },
    forbid: { cmd: [runs("npm|pnpm|yarn|npx")] },
  },
];
