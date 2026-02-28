# Startup Split Plan: packages/eslint-plugin

## Violations Found

### `start-install.ts`
- **Branching:** `if` statements on lines 70-97 (config file detection, content checking)
- **Import violation:** Imports `adapters/` (`pathJoinAdapter`, `fsExistsSyncAdapter`, `fsReadFileSyncAdapter`, `fsWriteFileSyncAdapter`) — startup can only import from `flows/`, `contracts/`, `statics/`, `errors/`

### `start-eslint-plugin.ts`
- **Branching:** Ternary on line 130 (`{ forTesting: true }`)
- **Import violation:** Imports 29 rule `brokers/` + 1 config `broker/` — startup can only import from `flows/`, `contracts/`, `statics/`, `errors/`

---

## Split Design

### 1. `start-install.ts` → flow → responder

**New files:**

| File | Purpose |
|------|---------|
| `src/responders/install/detect-config/install-detect-config-responder.ts` | All branching logic + adapter imports (config file detection, creation, skip logic) |
| `src/responders/install/detect-config/install-detect-config-responder.proxy.ts` | Proxy for responder tests |
| `src/responders/install/detect-config/install-detect-config-responder.test.ts` | Unit tests covering all 4 scenarios from current integration test |
| `src/flows/install/install-flow.ts` | Delegates to `InstallDetectConfigResponder` |
| `src/flows/install/install-flow.integration.test.ts` | Wiring test — startup calls flow, flow calls responder |

**Modified files:**

| File | Change |
|------|--------|
| `src/startup/start-install.ts` | Strip to pure delegation: `InstallFlow({ context })`. Remove adapter imports. |
| `src/startup/start-install.integration.test.ts` | Keep as wiring test OR redistribute to responder tests. All 4 assertions must survive. |

**Logic movement:**
- Lines 70-113 (for loop with if/else config detection) → responder
- Adapter imports → responder
- Statics import (`eslintConfigFilesStatics`) → responder
- Startup keeps: flow import, context passthrough

---

### 2. `start-eslint-plugin.ts` → flow → responder

**New files:**

| File | Purpose |
|------|---------|
| `src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts` | Imports all 29 rule brokers + config broker, builds plugin object, contains the ternary |
| `src/responders/eslint-plugin/create/eslint-plugin-create-responder.proxy.ts` | Proxy for responder tests |
| `src/responders/eslint-plugin/create/eslint-plugin-create-responder.test.ts` | Unit tests covering rule initialization + config initialization (13 scenarios from current integration test) |
| `src/flows/eslint-plugin/eslint-plugin-flow.ts` | Delegates to `EslintPluginCreateResponder` |
| `src/flows/eslint-plugin/eslint-plugin-flow.integration.test.ts` | Wiring test — startup calls flow, flow calls responder |

**Modified files:**

| File | Change |
|------|--------|
| `src/startup/start-eslint-plugin.ts` | Strip to pure delegation: `EslintPluginFlow()`. Remove all 30 broker imports. |
| `src/startup/start-eslint-plugin.integration.test.ts` | Redistribute to responder tests. All 13 assertions must survive. |

**Logic movement:**
- All 29 rule broker imports → responder
- Config broker import → responder
- Plugin object construction (rules map, configs map) → responder
- Ternary on line 130 → responder
- Startup keeps: flow import, passthrough

---

## Test Redistribution

| Original Test | New Home | Reason |
|---------------|----------|--------|
| `start-install.integration.test.ts` (4 scenarios: create config, skip existing+configured, skip existing+not configured, skip mjs) | `install-detect-config-responder.test.ts` | These test branching logic, which now lives in the responder |
| `start-eslint-plugin.integration.test.ts` (13 scenarios: rule initialization, config initialization) | `eslint-plugin-create-responder.test.ts` | These test plugin construction logic, which now lives in the responder |
| New: `install-flow.integration.test.ts` | Wiring test: flow delegates to responder | |
| New: `eslint-plugin-flow.integration.test.ts` | Wiring test: flow delegates to responder | |

Original integration test files can be deleted after redistribution OR kept as thin wiring tests (startup → flow delegation).

---

## File Count Summary

- **New files:** 10 (2 responders + 2 proxies + 2 responder tests + 2 flows + 2 flow tests)
- **Modified files:** 2 (both startup files stripped to delegation)
- **Deleted/redistributed:** 2 integration test files (assertions move to responder tests)
