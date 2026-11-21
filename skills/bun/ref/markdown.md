Docs: `/docs/runtime/markdown`

```ts
const html = Bun.markdown.html("# Hello **world**"); // GFM tables, strikethrough, task lists on by default
Bun.markdown.html(md, { autolinks: true, headings: true });
```
