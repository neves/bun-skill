Docs: `/docs/runtime/shell`

```ts
import { $ } from "bun";
const branch = (await $`git branch --show-current`.text()).trim(); // .text() is quiet
for await (const line of $`git branch --merged main`.lines()) { /* ... */ }
await $`git branch -d ${name}`; // interpolations are escaped, never shell-injected
const { exitCode } = await $`git diff --quiet`.nothrow(); // no throw on non-zero exit
```
