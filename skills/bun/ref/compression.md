Docs: `/docs/runtime/utils`

```ts
const gz = Bun.gzipSync(data); // Uint8Array; Bun.gunzipSync(gz) to reverse
Bun.zstdCompressSync(data); Bun.zstdDecompressSync(z); Bun.deflateSync(data); // also async zstdCompress
const body = Bun.file("log.txt").stream().pipeThrough(new CompressionStream("gzip")); // also "brotli", "zstd", "deflate"
await Bun.write("log.txt.gz", new Response(body));
```
