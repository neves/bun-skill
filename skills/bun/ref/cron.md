Docs: `/docs/runtime/cron`

```ts
const job = Bun.cron("*/5 * * * *", async () => { await sync(); }); // in-process
job.stop();
Bun.cron("0 9 * * *", report, { tz: "America/New_York" });
const next = Bun.cron.parse("30 9 * * MON-FRI"); // next matching Date
await Bun.cron("./worker.ts", "30 2 * * MON", "weekly-report"); // OS-level job, survives reboot
```
