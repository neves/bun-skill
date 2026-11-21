Docs: `/docs/runtime/file-io`

```ts
const pkg = await Bun.file("package.json").json(); // also .text() .bytes() .stream() .exists()
await Bun.write("package.json", JSON.stringify(pkg, null, 2) + "\n");
await Bun.write("copy.png", Bun.file("logo.png"));
await Bun.write("big.tar.gz", await fetch(url)); // streams the download to disk; also takes a ReadableStream
import { mkdir, readdir, rm } from "node:fs/promises"; // directories: node:fs is Bun's recommendation
```
