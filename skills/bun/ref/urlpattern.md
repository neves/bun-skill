Docs: standard `URLPattern`

```ts
const route = new URLPattern({ pathname: "/users/:id" });
route.test(url); // boolean
route.exec(url)?.pathname.groups.id; // "42"
```
