# Startup Split Plan: `packages/testing`

## Current State

Two startup files with violations:

### `start-endpoint-mock.ts` (68 lines)
- **Branching violations**: Ternary on line 23 (URL normalization), ternary on line 44 (response body)
- **Import violations**: Imports `msw` (npm package) and `mswServerAdapter` (adapters/) — startup can only import from flows/contracts/statics/errors
- **Exports**: `StartEndpointMock` object with `.listen()` method returning `EndpointControl`

### `start-endpoint-mock-setup.ts` (23 lines)
- **No branching violations**
- **Import violation**: Imports `mswServerAdapter` from adapters/ — not allowed in startup
- **No exports** — side-effect-only file (registers `beforeAll`/`afterEach`/`afterAll` jest hooks)

---

## Split Design

### File 1: `start-endpoint-mock.ts` → Flow + Responder

**New files to create:**

1. `packages/testing/src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.ts`
   - Receives ALL logic from current `StartEndpointMock.listen()`
   - Imports `msw` (http, HttpResponse), `mswServerAdapter`, and `EndpointControl`/`HttpMethod` contracts
   - Contains the ternary operators (allowed in responders)
   - Returns `EndpointControl` object with `resolves`, `responds`, `respondRaw`, `networkError` methods
   - Companion: `.proxy.ts` + `.test.ts`

2. `packages/testing/src/flows/endpoint-mock/endpoint-mock-flow.ts`
   - Delegates to `EndpointMockListenResponder`
   - Exports `EndpointMockFlow` with same API shape as current `StartEndpointMock`
   - Companion: `.integration.test.ts`

**Files to modify:**

3. `packages/testing/src/startup/start-endpoint-mock.ts`
   - Strip all logic, imports from adapters/msw
   - Import from `EndpointMockFlow` only
   - Re-export: `export const StartEndpointMock = EndpointMockFlow`

---

### File 2: `start-endpoint-mock-setup.ts` → Flow + Responder

**New files to create:**

4. `packages/testing/src/responders/endpoint-mock/setup/endpoint-mock-setup-responder.ts`
   - Imports `mswServerAdapter` from adapters/
   - Returns lifecycle methods: `{ listen, resetHandlers, close }`
   - Companion: `.proxy.ts` + `.test.ts`

5. `packages/testing/src/flows/endpoint-mock-setup/endpoint-mock-setup-flow.ts`
   - Delegates to `EndpointMockSetupResponder`
   - Returns lifecycle methods object
   - Companion: `.integration.test.ts`

**Files to modify:**

6. `packages/testing/src/startup/start-endpoint-mock-setup.ts`
   - Remove adapter import
   - Import lifecycle methods from `EndpointMockSetupFlow`
   - Keep `beforeAll`/`afterEach`/`afterAll` hook registrations (no branching — compliant)

---

## Test Redistribution

### From `start-endpoint-mock.integration.test.ts` (119 lines, 7 test cases):

**Move to responder tests** (`endpoint-mock-listen-responder.test.ts`):
- `listen with resolves` — tests response data logic
- `resolves called twice` — tests override behavior
- `listen with responds` — tests error status handling
- `responds with 204 no body` — tests empty body ternary
- `listen with networkError` — tests error path
- `default behavior` — tests default 500 response
- `POST method` — tests method routing

These all test the listen logic which moves to the responder.

**Flow integration test** (`endpoint-mock-flow.integration.test.ts`):
- Smoke test: `EndpointMockFlow.listen()` returns an `EndpointControl` object with expected methods
- Wiring test: a resolved mock correctly intercepts a fetch call

### From `start-endpoint-mock-setup.integration.test.ts` (36 lines, 2 test cases):

**Move to responder tests** (`endpoint-mock-setup-responder.test.ts`):
- `server running` — tests MSW intercepts handlers
- `new handler after reset` — tests handler reset lifecycle

**Flow integration test** (`endpoint-mock-setup-flow.integration.test.ts`):
- Smoke test: flow returns object with `listen`, `resetHandlers`, `close` methods

---

## File Summary

| Action | File Path |
|--------|-----------|
| CREATE | `src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.ts` |
| CREATE | `src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.proxy.ts` |
| CREATE | `src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.test.ts` |
| CREATE | `src/responders/endpoint-mock/setup/endpoint-mock-setup-responder.ts` |
| CREATE | `src/responders/endpoint-mock/setup/endpoint-mock-setup-responder.proxy.ts` |
| CREATE | `src/responders/endpoint-mock/setup/endpoint-mock-setup-responder.test.ts` |
| CREATE | `src/flows/endpoint-mock/endpoint-mock-flow.ts` |
| CREATE | `src/flows/endpoint-mock/endpoint-mock-flow.integration.test.ts` |
| CREATE | `src/flows/endpoint-mock-setup/endpoint-mock-setup-flow.ts` |
| CREATE | `src/flows/endpoint-mock-setup/endpoint-mock-setup-flow.integration.test.ts` |
| MODIFY | `src/startup/start-endpoint-mock.ts` |
| MODIFY | `src/startup/start-endpoint-mock-setup.ts` |
| DELETE | `src/startup/start-endpoint-mock.integration.test.ts` (tests redistributed) |
| DELETE | `src/startup/start-endpoint-mock-setup.integration.test.ts` (tests redistributed) |

All paths relative to `packages/testing/`.
