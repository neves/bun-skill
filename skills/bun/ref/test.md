Docs: `/docs/test`

```ts
import { test, expect, describe, mock, beforeEach } from "bun:test";
test("sum", () => expect(sum([1, 2])).toBe(3));
```

```ts
const fn = mock((x: number) => x * 2); // fn.mock.calls, .mockReturnValue(), .mockResolvedValue()
const spy = spyOn(api, "fetchUser"); // tracks calls, keeps the original
mock.module("./db", () => ({ query: mock(() => []) })); // replaces a module for importers
jest.useFakeTimers(); jest.advanceTimersByTime(1000); jest.useRealTimers(); // `jest` from "bun:test"
setSystemTime(new Date("2026-01-01")); // freeze Date.now()
```

Run with `bun test` (finds `*.test.ts`, `*.spec.ts`), `bun test --watch`, `bun test -t name`. Mocks: `/docs/test/mocks`.

```sh
bun test --coverage                       # text table; --coverage-reporter=lcov writes coverage/lcov.info
bun test --shard=1/3 --parallel           # CI: split across jobs, run files in worker processes
bun test --changed=main --retry=2         # only files affected by changes vs main; retry flaky tests
```
