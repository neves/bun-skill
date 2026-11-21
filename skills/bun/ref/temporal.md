Docs: standard `Temporal`

```ts
const today = Temporal.Now.plainDateISO();
today.add({ days: 7 }).toString(); // "2026-11-26"
Temporal.Instant.from("2026-01-01T00:00:00Z").toZonedDateTimeISO("America/Sao_Paulo");
Temporal.Duration.from({ hours: 2 }).total("minutes"); // 120
```
