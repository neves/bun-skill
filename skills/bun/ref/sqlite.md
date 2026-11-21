Docs: `/docs/runtime/sqlite`

```ts
import { Database } from "bun:sqlite";
const db = new Database("todos.sqlite", { create: true, strict: true });
db.run("CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY, title TEXT, done INTEGER DEFAULT 0)");
db.query("INSERT INTO todos (title) VALUES ($title)").run({ title: "x" });
const rows = db.query("SELECT * FROM todos WHERE done = ?").all(0); // .get() for one row
```
