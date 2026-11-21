Docs: `/docs/runtime/redis`

```ts
import { redis, RedisClient } from "bun"; // `redis` reads REDIS_URL
await redis.set("key", "value");
await redis.expire("key", 3600); // TTL in seconds
const value = await redis.get("key"); // string | null
await redis.del("key");
const client = new RedisClient("redis://localhost:6379");
await redis.send("LPUSH", ["list", "a"]); // any other command
client.close();
```
