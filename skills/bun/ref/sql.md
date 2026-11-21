Docs: `/docs/runtime/sql`

```ts
import { sql, SQL } from "bun"; // `sql` reads DATABASE_URL
const users = await sql<User[]>`SELECT * FROM users WHERE id = ${id}`; // parameterized; <T> types the rows
const [user] = await sql`INSERT INTO users ${sql({ name, email })} RETURNING *`; // object or array of objects
await sql.begin(async (tx) => { await tx`UPDATE users SET name = ${name} WHERE id = ${id}`; });
const mysql = new SQL("mysql://user:pass@localhost:3306/db");
```
