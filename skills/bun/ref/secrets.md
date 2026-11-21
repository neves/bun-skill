Docs: `/docs/runtime/secrets`

```ts
import { secrets } from "bun"; // OS keychain
await secrets.set({ service: "my-cli", name: "github-token", value: token });
const token = await secrets.get({ service: "my-cli", name: "github-token" }); // string | null
await secrets.delete({ service: "my-cli", name: "github-token" });
```
