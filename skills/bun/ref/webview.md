Docs: `/docs/runtime/webview`

```ts
await using view = new Bun.WebView({ width: 1280, height: 720 }); // closes automatically
await view.navigate("https://example.com");
await view.click("a[href]"); // waits until clickable
const title = await view.evaluate("document.title");
await Bun.write("page.png", await view.screenshot());
```
