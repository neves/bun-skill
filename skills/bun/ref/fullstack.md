Docs: `/docs/bundler/fullstack`

```sh
bun ./index.html # dev server: bundles <script>/<link> tags, TS/JSX/CSS, hot reload
```

```ts
import homepage from "./index.html";
Bun.serve({
  routes: { "/": homepage, "/api/todos": { GET: () => Response.json(todos) } },
  development: true, // detailed errors + hot reload
});
```
