// Agentic eval: one headless Claude Code session per case, with only the bun
// skill installed. Run: bun test evals  (filter: bun test evals -t sqlite)
import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cases, type Case } from "./cases";

const MODEL = Bun.env.EVAL_MODEL ?? "claude-haiku-5-5";
// forced: prompt starts with /bun, so the skill is loaded and only its content is graded.
// auto: plain prompt, so the description must trigger the skill on its own.
const TRIGGER = Bun.env.EVAL_TRIGGER === "auto" ? "auto" : "forced";
const SKILL_DIR = join(import.meta.dir, "../skills/bun");
const RUNS_DIR = join(import.meta.dir, ".runs", new Date().toISOString().replace(/[:.]/g, "-"));
const TIMEOUT = 6 * 60_000;

const FIXTURE: Record<string, string> = {
  "package.json": JSON.stringify(
    { name: "app", type: "module", engines: { bun: ">=1.4.0" }, devDependencies: { "@types/bun": "latest" } },
    null,
    2,
  ),
  "bun.lock": `{\n  "lockfileVersion": 1,\n  "workspaces": {\n    "": {\n      "name": "app",\n    },\n  },\n}\n`,
  "tsconfig.json": JSON.stringify({ compilerOptions: { strict: true, module: "Preserve", target: "ESNext", moduleResolution: "bundler", types: ["bun"], noEmit: true } }, null, 2),
};

type ToolUse = { name: string; input: Record<string, any> };

async function setup(c: Case) {
  const dir = await mkdtemp(join(tmpdir(), `bun-skill-${c.id}-`));
  const files = { ...FIXTURE, ...c.files };
  for (const [path, content] of Object.entries(files)) await Bun.write(join(dir, path), content);
  await mkdir(join(dir, ".claude/skills"), { recursive: true });
  await symlink(SKILL_DIR, join(dir, ".claude/skills/bun"));
  await Bun.$`git init -q -b main && git add -A && git -c user.email=e@e -c user.name=e commit -qm init`.cwd(dir).quiet();
  return { dir, files };
}

async function runAgent(dir: string, prompt: string, id: string) {
  const proc = Bun.spawn(
    [
      "claude", "-p", prompt,
      "--model", MODEL,
      "--output-format", "stream-json", "--verbose",
      "--setting-sources", "project", // only the project's skills: no user skills, no CLAUDE.md
      "--strict-mcp-config", // no MCP servers
      "--permission-mode", "bypassPermissions",
      "--no-session-persistence",
      "--max-budget-usd", "1",
    ],
    { cwd: dir, stdout: "pipe", stderr: "pipe", env: { ...Bun.env, CLAUDECODE: "" } },
  );
  const out = await new Response(proc.stdout).text();
  await proc.exited;
  await Bun.write(join(RUNS_DIR, `${id}.jsonl`), out);

  const tools: ToolUse[] = [];
  let result = "";
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    const ev = JSON.parse(line);
    if (ev.type === "assistant")
      for (const block of ev.message?.content ?? []) if (block.type === "tool_use") tools.push({ name: block.name, input: block.input });
    if (ev.type === "result") result = ev.result ?? "";
  }
  return { tools, result };
}

// Text of every file the agent created or modified (lockfiles and deps excluded).
async function changedCode(dir: string, before: Record<string, string>) {
  const glob = new Bun.Glob("**/*.{ts,tsx,js,mjs,cjs,json,toml,yaml,yml}");
  let text = "";
  for await (const path of glob.scan({ cwd: dir, dot: false })) {
    if (path.startsWith("node_modules/") || path.startsWith("dist/") || path === "bun.lock") continue;
    const content = await Bun.file(join(dir, path)).text();
    if (before[path] !== content) text += `\n// ---- ${path}\n${content}`;
  }
  return text;
}

const isWebLookup = (t: ToolUse) =>
  t.name === "WebSearch" ||
  t.name === "WebFetch" ||
  t.name.startsWith("mcp__") ||
  (t.name === "Bash" && /\b(curl|wget)\b[^\n;&|]*https?:\/\/(?!(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|\$))/.test(t.input.command ?? ""));

function grade(c: Case, tools: ToolUse[], code: string) {
  const cmds = tools.filter((t) => t.name === "Bash").map((t) => String(t.input.command)).join("\n");
  const failures: string[] = [];

  // stream-json does not echo a /bun expansion, so forced mode counts as loaded.
  const loaded = TRIGGER === "forced" || tools.some((t) => t.name === "Skill" && t.input.skill === "bun");
  if (!loaded) failures.push("skill `bun` was not loaded");
  for (const t of tools.filter(isWebLookup)) failures.push(`web lookup: ${t.name} ${JSON.stringify(t.input).slice(0, 160)}`);

  for (const re of c.expect.cmd ?? []) if (!re.test(cmds)) failures.push(`no command matched ${re}`);
  for (const re of c.expect.code ?? []) if (!re.test(code)) failures.push(`no code matched ${re}`);
  const any = c.expect.anyOf;
  if (any && ![...(any.cmd ?? []).map((re) => re.test(cmds)), ...(any.code ?? []).map((re) => re.test(code))].some(Boolean))
    failures.push(`none of ${[...(any.cmd ?? []), ...(any.code ?? [])].join(" | ")} matched`);
  for (const re of c.forbid.cmd ?? []) if (re.test(cmds)) failures.push(`forbidden command ${re}`);
  for (const re of c.forbid.code ?? []) if (re.test(code)) failures.push(`forbidden code ${re}`);
  return { failures, cmds };
}

const hasSubcommand = (cmd: string) => Bun.spawnSync(["bun", cmd, "--help"]).exitCode === 0;

describe(`bun skill (${MODEL}, ${TRIGGER})`, () => {
  test.concurrent.each(cases.map((c) => [c.id, c] as const))(
    "%s",
    async (id, c) => {
      if (c.requires && !hasSubcommand(c.requires)) {
        console.warn(`[${id}] skipped: \`bun ${c.requires}\` is missing from Bun ${Bun.version}`);
        return;
      }
      const { dir, files } = await setup(c);
      const prompt = TRIGGER === "forced" ? `/bun ${c.prompt}` : c.prompt;
      const { tools } = await runAgent(dir, prompt, id);
      const code = await changedCode(dir, files);
      const { failures, cmds } = grade(c, tools, code);
      if (failures.length)
        console.error(
          `\n[${id}] FAIL\n  - ${failures.join("\n  - ")}\n  tools: ${tools.map((t) => t.name).join(", ")}\n  commands:\n    ${cmds.split("\n").join("\n    ")}\n  workdir: ${dir}\n  transcript: ${join(RUNS_DIR, id + ".jsonl")}`,
        );
      expect(failures).toEqual([]);
    },
    TIMEOUT,
  );
});
