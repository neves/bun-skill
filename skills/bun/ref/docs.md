The source of truth is the **Bun docs MCP server** at `https://bun.com/docs/mcp`: every docs page, guide and release note, including features newer than this skill.

- `search_bun`: ranked search; start here (`"bun lint"`, `"Bun.serve websocket"`).
- `read_bun_page`: full markdown of a path (`/docs/runtime/shell`).
- `grep_bun`: exact identifiers, flags, error messages.

When those tools are not connected, call the same server over HTTP (stateless JSON-RPC):

```sh
curl -s https://bun.com/docs/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_bun","arguments":{"query":"bun lint","limit":5}}}'
```

Any doc path also reads as raw markdown at `https://bun.com<path>.md`.
