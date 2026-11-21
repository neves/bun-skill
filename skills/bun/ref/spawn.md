Docs: `/docs/runtime/child-process`

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
