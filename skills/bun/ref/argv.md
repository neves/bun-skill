Docs: `/docs/guides/process/argv`

```ts
import { parseArgs } from "util";
const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2), // drop `bun` and the script path
  options: {
    out: { type: "string", short: "o", default: "dist" },
    verbose: { type: "boolean", short: "v" },
    tag: { type: "string", multiple: true }, // --tag a --tag b → ["a", "b"]
  },
  strict: true, // unknown flags throw
  allowPositionals: true,
});
```
