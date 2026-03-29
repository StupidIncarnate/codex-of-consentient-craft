# Follow-Up Issues

## 1. Dev server port cleanup hardcodes two ports (server + web)

**Where:** `packages/orchestrator/src/brokers/dev-server/start/dev-server-start-broker.ts`

**Problem:** The broker calls `processKillByPortAdapter` for `port` and `port + 1` before starting the dev server. This assumes dungeonmaster's own convention (Hono server on `port`, Vite web on `port + 1`). Other projects using this npm package may have different port layouts — three services, non-sequential ports, etc.

**Current config shape:**
```typescript
devServer: {
  devCommand: string,
  port: number,        // single port, used for readiness check
  buildCommand: string,
  readinessPath: string,
  readinessTimeoutMs: number,
}
```

**Fix options:**
- **Option A:** Replace `port` with `ports: number[]` — first entry is the readiness-check port, all entries get cleaned up before start.
- **Option B:** Keep `port` as the readiness-check target, add optional `killPorts: number[]` for cleanup. Defaults to `[port]` if omitted.

**When fixing:** grep for `port + 1` and `port +1` across the codebase — the two-port assumption may have leaked into other places (proxy setup helpers, test assertions, siegemaster layer broker). Fix all of them, not just the broker.

**Known affected files:**
- `packages/config/src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts` (config shape)
- `packages/orchestrator/src/brokers/dev-server/start/dev-server-start-broker.ts` (kill loop)
- `packages/orchestrator/src/brokers/dev-server/start/dev-server-start-broker.proxy.ts` (test setup — `killByPortProxy.portIsEmpty()` called twice)
- `packages/orchestrator/src/brokers/dev-server/start/dev-server-start-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/orchestration-loop/run-siegemaster-layer-broker.ts` (passes port to broker)

## 2. Dev server start failure routes to pathseeker replan

**Where:** `packages/orchestrator/src/brokers/quest/orchestration-loop/run-siegemaster-layer-broker.ts` (server start catch block, ~line 153)

**Problem:** If the dev server fails to start, the siegemaster work item is marked `failed` and a pathseeker replan is created. Pathseeker replans implementation steps — but a server startup failure isn't an implementation problem. It's a config issue (wrong command, missing dependency), port conflict, or environment problem. Replanning won't fix any of these.

**Better options:**
- Route to spiritmender with server output/logs (let it try to fix missing packages, bad config)
- Bubble to user as `blocked` with the error message (user fixes their dev config and retries)
- Retry with diagnostics — capture stderr, try once more, then bubble if still failing
