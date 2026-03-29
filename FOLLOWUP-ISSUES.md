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

## 3. Lawbringer should detect duplicated string lists and reusable syntax patterns

**Where:** Lawbringer agent role — currently reviews file pairs for lint/style compliance

**Problem:** Lawbringer doesn't check for duplicated string lists across files (e.g. the same array of allowed values hardcoded in multiple places) or duplicated syntax patterns that could be extracted into reusable structures (transformers, guards, statics). This kind of duplication is invisible to lint rules but creates maintenance burden — when a value changes, every copy needs updating.

**Examples of what to catch:**
- Same list of role names, status strings, or config keys repeated in multiple files
- Identical validation/parsing logic copy-pasted across brokers
- Repeated conditional patterns that should be a guard
- Duplicated data transformations that should be a transformer

**Fix:** Extend lawbringer's review scope to flag these patterns and suggest extraction into the appropriate architecture folder (statics for constant lists, guards for boolean checks, transformers for data reshaping).

**Docs cleanup:** When extending lawbringer's scope, also audit standard docs (`CLAUDE.md` files, agent prompts, MCP tool output) to ensure they don't contain examples of the duplicated patterns lawbringer is now flagging. Update docs to show the correct extraction patterns.

## 4. Ban `expect.any(Object)` in tests

**Problem:** `expect.any(Object)` matches literally anything that isn't `null` or `undefined` — it's a non-assertion disguised as an assertion. Tests using it look like they're checking a value but they're actually accepting whatever garbage the implementation returns. This is the same class of problem as `toMatchObject` (which is already banned) — it lets tests pass without proving correctness.

**Ban all of these:**
- `expect.any(Object)` — matches anything non-null, proves nothing
- `expect.any(String)` — accepts any string, doesn't verify the actual value
- `expect.stringContaining()` — partial string match, hides what the full value should be
- `toContain()` — same problem, partial match that lets garbage through

**Also ban these matchers:**
- `toHaveBeenCalled()` — proves the function was called but not with what. Useless without `toHaveBeenCalledWith`.
- `toHaveBeenCalledTimes(N)` without a corresponding `toHaveBeenCalledWith` — knowing it was called 3 times means nothing if you don't verify what was passed each time. `toHaveBeenCalledTimes` is only allowed when paired with `toHaveBeenCalledWith` assertions covering the actual arguments.

**Fix:** Add an ESLint rule (or extend an existing one like `enforce-contract-usage-in-tests`) to ban all of the above. Tests should assert on the exact value or use a contract stub/`toStrictEqual` to verify the exact shape. If the value is dynamic (timestamps, UUIDs), mock the source (`Date.now`, `crypto.randomUUID`) and assert the deterministic result.

**Also ban:**
- `.not.` negated matchers (`.not.toMatch`, `.not.toBe`, `.not.toContain`, etc.) — negated assertions prove what something ISN'T, not what it IS. A test that says "the result is not X" passes for infinite wrong values. Tests must assert the positive — what the value actually equals. If the test needs to verify absence, assert on the complete state instead (e.g. assert the full array with `toStrictEqual` rather than `.not.toContain` a single element).
- `expect(true).toBe(true)` and any variant (`expect(false).toBe(false)`, `expect(1).toBe(1)`, etc.) — these are placeholder assertions that prove nothing happened. Every test must assert that something actually occurred. If the test verifies a side effect (function called, file written, event emitted), use `registerMock` to capture the call and assert on it with `toHaveBeenCalledWith`. If the test verifies a return value, assert on the actual return. There is no valid case for a tautological assertion.

**Also ban:**

- expect(Object.keys(spiritmenderContextStatics.lawbringerFailure)).toStrictEqual(). It shouldnt be using keys to bypass
  the expect.
- expect(String(questStartContent).includes('monitoring quest execution')).toBe(true): Need to properly expect the full
  string

**Docs cleanup:** When implementing these bans, also audit and update all standard docs (`CLAUDE.md` files, `get-testing-patterns` MCP output, agent prompts in `packages/orchestrator/src/statics/`) to remove any examples or guidance that use the banned patterns. Docs that show `expect.any(Object)` or `toHaveBeenCalled()` as valid patterns will cause agents to keep producing banned code.

