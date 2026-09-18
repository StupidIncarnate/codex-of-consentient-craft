# Step Verb: `request` Plan

> **Tracking:** Part 7 Item 15 (line 2108), Part 8 line 2728–2733 & 2834 of `scrolls/seigelense/siegelense-tooling.md`.

---

## 1. Requirements & Spec Citations

| # | Spec Citation | Requirement |
|---|---|---|
| R1 | Line 2108 | Part 7 item 15: "`resize`, and a direct `request` step for the curl surface — Coverage no walk can reach today" |
| R2 | Line 2413 | `docs { for: 'operational' }` names `request` for flows with no screen |
| R3 | Line 2614 | Listed under Steps that are new |
| R4 | Line 2728–2733 | Syntax: `{ step: 'request', method: 'POST' | 'GET' | ..., path: '/api/guilds', body?: ..., headers?: ... }` |
| R5 | Line 2834 | Error expectation: `{ step: 'request', method: 'POST', path: '/api/guilds', body: { name: null }, expect: 'error' }` |
| R6 | Line 2837–2839 | 4xx/5xx status throws so `expect: 'error'` turns it into `ok: true`, whereas `expect !== 'error'` marks it `ok: false` and stops the batch. A step with `expect: 'error'` that receives 2xx/3xx returns `ok: false` (finding) |
| R7 | Line 2413 | Runs on both browser and headless specs (uses `lane.apiBaseUrl`, excluded from `verbs.browser`) |
| R8 | Line 696 | Not an acting browser step (does not mutate browser DOM directly), excluded from `verbs.acting`, `verbs.capturing`, and `verbs.targeting` |
| R9 | Architecture | Returns a ContentText reading formatting HTTP status and response: e.g. `200 OK — {"id":...}` |

---

## 2. Architecture & File Layout

### Statics
- `packages/siegelense/src/statics/step/step-statics.ts`:
  - `verbs.all`: add `'request'` (15th verb)
  - Excluded from `verbs.acting`, `verbs.capturing`, `verbs.browser`, `verbs.targeting`
- `packages/siegelense/src/statics/request/request-statics.ts`:
  - Default method `'GET'`, timeout default (e.g. 10000ms), reading format templates

### Errors
- `packages/siegelense/src/errors/http-request-failed/http-request-failed-error.ts`:
  - Carries `{ status: number; statusText: string; body: string; url: string }`

### Contracts & Stubs
- `packages/siegelense/src/contracts/http-method/http-method-contract.ts`:
  - Enum `'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'`
- `packages/siegelense/src/contracts/step/step-contract.ts`:
  - Add `request` variant: `{ step: z.literal('request'), method: httpMethodContract.default('GET'), path: z.string(), body: z.unknown().optional(), headers: z.record(z.string()).optional() }`
- `packages/siegelense/src/contracts/http-request-reading/http-request-reading-contract.ts`:
  - `{ status: number, statusText: string, headers: Record<string, string>, body: unknown }` + stub + test

### Adapters
- `packages/siegelense/src/adapters/fetch/http-request/fetch-http-request-adapter.ts` + `.proxy.ts` + `.test.ts`:
  - Uses `globalThis.fetch(url, { method, headers, body, signal })`
  - Returns parsed result `{ status, statusText, headers, body }`

### Transformers
- `packages/siegelense/src/transformers/http-request-reading-render/http-request-reading-render-transformer.ts` + `.test.ts`:
  - Formats reading as `${status} ${statusText} — ${bodyPreview}` as `ContentText`

### Brokers
- `packages/siegelense/src/brokers/step/request/step-request-broker.ts` + `.proxy.ts` + `.test.ts`:
  - Resolves target URL from `lane.apiBaseUrl` + `step.path`
  - Calls `fetchHttpRequestAdapter`
  - If status >= 400: throws `HttpRequestFailedError`
  - Returns rendered `ContentText`
- `packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.ts`:
  - Route `step.step === 'request'` to `stepRequestBroker`
- `packages/siegelense/src/statics/docs/docs-statics.ts`:
  - Update verb count from 14 to 15

---

## 3. Manual Verification (The Driver)

1. Boot instance `dungeonmaster-headless` (verifying browserless operation).
2. Drive successful GET request:
   `dungeonmaster siegelense run --instance <id> --steps '[{"step":"request","method":"GET","path":"/api/guilds"}]'`
   Verify:
   - status: `done`
   - reading: `200 OK — [...]`
3. Drive adversarial POST request expecting error:
   `dungeonmaster siegelense run --instance <id> --steps '[{"step":"request","method":"POST","path":"/api/guilds","body":{"name":null},"expect":"error"}]'`
   Verify:
   - status: `done`, `ok: true` (attack caught, error was expected)
   - reading reflects 400 error status
4. Drive request expecting error that succeeds:
   Verify batch halts with `ok: false` (finding: unexpected success).
5. Query results off disk via `results --step 1`.
6. Tear down instance and sweep processes and sockets.
