Docs: `/docs/runtime/yaml`, `/docs/runtime/jsonl`

```ts
const config = Bun.YAML.parse(await Bun.file("config.yaml").text());
import config2 from "./config.yaml"; // or import the file directly (also .toml, .json5)
Bun.TOML.parse(text);
Bun.JSONC.parse(text); // comments and trailing commas, like tsconfig.json
Bun.JSONL.parse(ndjson); // array of records; Bun.JSONL.parseChunk for streams
```
