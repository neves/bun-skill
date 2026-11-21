Docs: `/docs/runtime/utils`

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
