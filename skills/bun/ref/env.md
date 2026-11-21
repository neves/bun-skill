Docs: `/docs/runtime/environment-variables`

```ts
// .env, .env.local, .env.<NODE_ENV> load automatically
const apiKey = Bun.env.API_KEY; // same object as process.env
```

```sh
bun --env-file=.env.prod server.ts # load specific files (repeatable); --no-env-file skips .env
```
