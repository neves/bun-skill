Docs: `/docs/runtime/hashing`

```ts
const hash = await Bun.password.hash(password); // argon2id by default
const ok = await Bun.password.verify(password, hash);
Bun.hash("data"); // fast non-crypto hash
new Bun.CryptoHasher("sha256").update("data").digest("hex");
```
