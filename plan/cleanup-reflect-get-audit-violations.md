# Cleanup Prompt — Reflect.get Audit Lint Violations

## Context

Five new lint rules were added to surface a single anti-pattern: the LLM was
using `Reflect.get`, raw `JSON.parse(...).field`, `unknown`/`object` returns,
and untyped `z.unknown()` payloads as **escape hatches** when the type system
pushed back. The old syntax-rules doc blessed `Reflect.get` as the recommended
alternative to `as Record<…>` casts, so the model internalized it as a
universal opt-out. These rules close every escape route at once and force
data through Zod contracts at the I/O boundary.

**Total surfaced: ~771 violations** at the time the rules landed (count will
shift as you fix). Regenerate the inventory at any time:

```
npm run build
npm run ward -- --only lint > plan/lint-violation-inventory.txt
```

The cleanup is **structural**, not cosmetic. Every violation traces back to
"untyped data is flowing past the I/O boundary without a contract." The fix
is almost never to silence the rule — it is to introduce or extend a Zod
contract at the right layer and let the typed value flow downstream.

---

## The Five Rules

### 1. `@dungeonmaster/require-validation-on-untyped-property-access`

**What it bans:**
- `Reflect.get(x, k)` where `x` is not the result of a `*.parse(...)` /
  `*.safeParse(...).data` chain (inline) or an alias whose initializer in
  the same block is a parse chain.
- `JSON.parse(s).field` — direct property access on a `JSON.parse` result.
- `const x = JSON.parse(s); x.field` — same-block-alias variant.

**Why:** these are the three shapes the LLM used to dodge contract validation.

**Carve-outs (rule does NOT fire):**
- `*-guard.ts` — type guards inspect raw shapes
- `*-contract.ts` — contract refiners inspect raw shapes
- `*-adapter.ts` — I/O boundary; this is where validation should HAPPEN, not
  where it should already have happened
- `*.stub.ts` — stubs author contract-shaped values; they're trusted

**Fix patterns:**

| Violation shape | Root cause | Fix |
|---|---|---|
| `Reflect.get(parsedJsonl, 'type')` in a transformer | JSONL line is `unknown` because no contract validates it | Author or extend the contract for that line shape; replace with `parsedLineContract.parse(rawLine).type` |
| `JSON.parse(text).field` in a transformer | external JSON has no contract | Author an external-JSON contract (see `packages/ward/src/contracts/playwright-json-report/` reference); replace with `playwrightJsonReportContract.parse(JSON.parse(text)).field` |
| `Reflect.get(toolUse.input, 'session_id')` | `toolUse.input` is `unknown` per the assistant-stream contract | Either narrow at the contract level (add a discriminated input shape) or pass through a guard |
| `Reflect.get(folderConfigStatics, folderType)` | this is a typed static map lookup the LLM wrote with Reflect.get out of habit | Use bracket access: `folderConfigStatics[folderType]` (the rule never fires on bracket access — it forces this resolution implicitly) |

**The diagnostic question:** "Where did this `unknown` come from, and where
SHOULD a contract have validated it?" If the answer is "an `*-adapter.ts`
read it from disk / a CLI / an HTTP response," extend that adapter to return
a contract-shaped type. If the answer is "a transformer received a raw blob
from elsewhere," the contract belongs at the boundary the blob crossed.

### 2. Extension to `@dungeonmaster/enforce-folder-return-types`

**What it bans (NEW):**
- Function return types of `unknown`, `object`, `Record<PropertyKey, unknown>`,
  `Record<string, unknown>` in function-exporting folders (transformers,
  brokers, responders, guards, etc.)

**Why:** the existing rule banned `void`/`Promise<void>`; the LLM sidestepped
by returning `unknown`. Now both routes are closed.

**Carve-outs:**
- `*-contract.ts`, `*-adapter.ts` — I/O boundary, may legitimately surface
  unknown shapes
- `*.proxy.ts` — accepts `readonly unknown[]` as the minimum generalization
  (proxy capture getters that return mock-call argument arrays)

**Fix patterns:**

| Violation | Root cause | Fix |
|---|---|---|
| `transformerXyz(...): unknown` | transformer returns a raw parsed blob | Author/extend the output contract; type the function as `Foo` from `foo-contract.ts` |
| `(): Record<string, unknown>` in a broker | broker built up an untyped accumulator | Define the accumulator's contract; return `Foo` |
| Proxy getter `getSpawnedArgs: () => unknown` | proxy captured a mock-call args array as `unknown` | Change to `() => readonly unknown[]` (allowed) — the test re-brands via Stub() |

### 3. `@dungeonmaster/ban-unknown-payload-in-discriminated-union`

**What it bans:**
- A `z.discriminatedUnion(<tag>, [variants])` where any variant has a field
  typed `z.unknown()` or `z.record(<anything>, z.unknown())`.
- Predicate chases identifier bindings (e.g.,
  `payload: genericPayloadSchema` where `genericPayloadSchema` is a top-level
  `const = z.record(*, z.unknown())`).

**Why:** the discriminator tag is supposed to BUY you exhaustive typing on
the payload. An `unknown` payload defeats the discriminator's purpose and
forces every consumer to use Reflect.get / casts to read the payload.

**Carve-out:**
- A field whose key ends with `Raw` (e.g., `payloadRaw: z.unknown()`) is
  permitted — for legitimate third-party event passthrough where the schema
  genuinely doesn't know the shape.

**Fix pattern:**

The fix is **per-variant typing**: split the variant into specific shapes.
Reference: `packages/web/src/bindings/use-session-chat/use-session-chat-binding.ts`
(in the audit worktree at `worktree-reflect-get-audit`) shows the consumer
side after a discriminated-union refactor — readers narrow on the tag and
get a typed payload, no Reflect.get needed.

For `ws-message-contract.ts` specifically: each message type
(`session-list`, `chat-line`, `quest-status-change`, etc.) has a known
payload shape. Replace the generic `z.record(brand, z.unknown())` payload
with per-variant payload schemas keyed by the discriminator tag.

### 4. `@dungeonmaster/ban-reflect-outside-guards`

**What it bans:**
- `Reflect.get(...)` and `Reflect.set(...)` anywhere except `*-guard.ts` and
  `*-contract.ts`.

**Why:** Rule 1 catches the unvalidated-access cases. This rule is the
final safety net — even if Reflect is being used "validly" (e.g., on a
typed static map), it's almost always a smell. Forcing its absence pushes
the author to either bracket access (typed maps) or contract validation
(untyped data).

**Carve-outs:**
- `*-guard.ts` — guards inspect raw shapes legitimately
- `*-contract.ts` — refiners do the same
- `Reflect.deleteProperty(...)` is **not** banned (the LLM-readable syntax
  rules doc requires it for computed-key delete in adapters)

**Fix patterns:**

| Violation | Fix |
|---|---|
| `Reflect.get(folderConfigStatics, folderType)` (typed static map) | `folderConfigStatics[folderType]` — bracket access on Record types is fine |
| `Reflect.get(rawJsonlLine, 'type')` | Author/use the contract; `parsedLineContract.parse(rawJsonlLine).type` |
| `Reflect.set(obj, 'key', value)` | If `obj` is a typed accumulator, just assign: `obj.key = value`. If not, you need a contract. |

### 5. `@dungeonmaster/ban-require-in-source`

**What it bans:**
- Raw `require('...')` calls in any source/test file.

**Why:** the LLM used `require()` to reach for runtime modules without
going through TypeScript's import resolution — typically as part of a
`Reflect.get` chain on the resolved module.

**Carve-outs:**
- `requireActual({ module: '...' })` from `@dungeonmaster/testing/register-mock`
  — different identifier (`requireActual`, not `require`), so the predicate
  naturally doesn't match
- ES `import` and dynamic `await import('...')` are unaffected

**Fix patterns:**

| Violation | Fix |
|---|---|
| `const events = require('../../state/events-state')` | Convert to top-of-file `import` (for static deps) or `await import('...')` (for genuinely dynamic loads — rare) |
| `require()` followed by `Reflect.get(...)` | The whole chain is the symptom. Replace with a typed import; the Reflect.get on its result will then either type-check natively or surface a Rule 1 violation pointing at the real contract gap. |

---

## Diagnosis Methodology

When you hit a lint error, **resist the urge to silence it**. The rule is
the symptom; the disease is upstream. Walk the diagnosis backward:

1. **What is the rule complaining about?** Read the error message verbatim.
2. **What is the offending value's TYPE at this point?** Hover or `tsc` it.
   If it's `unknown` / `object` / `Record<PropertyKey, unknown>` /
   `Record<string, unknown>`, that's the smoking gun.
3. **Where did that type originate?** Trace upstream:
   - From a function parameter typed `unknown` → the caller passed an
     unvalidated value, OR the parameter type is itself wrong
   - From `JSON.parse(...)` → an external-JSON contract is missing
   - From an `*-adapter.ts` returning loose types → the adapter needs a
     contract-shaped return type
   - From a discriminated-union variant with `z.unknown()` payload → the
     contract is the wrong shape; per-variant payloads are required
4. **Where SHOULD the contract live?** Apply the rule:
   - **External JSON** (CLI output, file content, HTTP response) → contract
     in the package that owns the I/O boundary, used via the adapter
   - **In-memory data shapes** → contract in `packages/<pkg>/src/contracts/`
     or `packages/shared/src/contracts/` if cross-package
   - **Discriminated union** → split per-variant, no `z.unknown()` payloads
5. **Apply the fix at the contract layer.** The Reflect.get / JSON.parse /
   `unknown`-return goes away as a side effect, not as the primary edit.

**Anti-pattern to avoid:** adding `// eslint-disable` comments, renaming a
file to `*-guard.ts` to dodge the rule, declaring `payloadRaw` instead of
fixing the discriminated-union shape, or wrapping `Reflect.get` in a
`*-guard.ts` helper just to satisfy the predicate. These are the same
escape hatches in different clothes — the rules will fire again somewhere
downstream.

---

## Reference Patterns

The audit team built reference fixes on `worktree-reflect-get-audit` to
validate the rule shape. **Do NOT cherry-pick these — they're shape
examples, not committable.** Read them when you need a concrete model:

- `packages/orchestrator/src/contracts/parsed-user-stream-line/` —
  external-JSONL contract pattern with `.passthrough()` (Rule 1 fix shape)
- `packages/ward/src/contracts/playwright-json-report/` — external JSON
  contract pattern (Rule 1 fix shape)
- `packages/orchestrator/src/brokers/agent/spawn-by-role/agent-spawn-by-role-broker.proxy.ts` —
  typed proxy getter returning `readonly unknown[]` (Rule 2 fix shape)
- `packages/web/src/bindings/use-session-chat/use-session-chat-binding.ts` —
  discriminated-union consumer that narrows on the tag (Rule 3 consumer
  shape)
- `packages/shared/src/contracts/ws-message/ws-message-contract.ts` —
  the existing under-typed shape that Rule 3 fires on; this is the BEFORE,
  not the AFTER

---

## Workflow for the Cleanup Pass

1. **Regenerate the violation inventory:**
   ```
   npm run build
   npm run ward -- --only lint > plan/lint-violation-inventory.txt
   ```

2. **Group by root contract gap, not by file.** Multiple violations across
   transformers / brokers / responders often share one missing contract
   upstream. Fix the contract once; downstream violations clear in bulk.

3. **Fix in this order** for fastest reduction in violation count:
   - Author/extend external-JSON contracts at adapter boundaries
     (Rule 1 + Rule 4 cascades)
   - Replace `unknown`/`object`/`Record<…>` returns with contract types
     (Rule 2)
   - Split discriminated-union payloads per-variant
     (Rule 3 — small set of files, large downstream impact)
   - Convert `require()` to `import` (Rule 5 — small, mostly mechanical)
   - Mop up residual Reflect.get / Reflect.set sites (Rule 4)

4. **Run scoped ward after each contract introduction:**
   ```
   npm run build
   npm run ward -- --only lint,typecheck -- packages/<affected-package>
   ```
   Use `timeout: 600000`. Confirm the violation count dropped before moving
   on.

5. **Final ward must be fully green** — no lint, typecheck, or test errors.
   Investigate every failure. "Pre-existing" is not an excuse; the audit
   branch was green before merge.

---

## Constraints

- **Use `timeout: 600000`** on every `npm run ward` call.
- **NEVER `cd` into a package** — ward runs from repo root with paths after
  `--`.
- **`npm run build` BEFORE every ward** — cross-package types resolve
  through `dist/`. Stale dist surfaces as TS2339 on cross-package APIs.
- **No `eslint-disable` comments.** If you genuinely believe a rule is
  wrong, file a `> [!]` note in this plan and stop — do NOT silence.
- **No file renames to dodge carve-outs.** Renaming `foo-broker.ts` to
  `foo-guard.ts` to escape Rule 4 is a violation of intent.
- **Use the project's testing patterns:** `registerMock` proxy pattern
  (no `jest.mock()` / `jest.spyOn()`), `toStrictEqual` / `toBe` (no
  `toEqual` / `toMatchObject` / `toContain`), inline setup per test
  (no `beforeEach` / `afterEach`).
- **Only edit the codebase, not the rules.** The 5 rules are correct as
  authored; if a predicate seems wrong, file a `> [!]` note and continue.

---

## Done Criteria

- `npm run ward -- --only lint` exits 0 — zero violations across all 5 new
  rules
- `npm run ward` (full) exits 0 — typecheck, unit, integration, e2e all
  green
- No `eslint-disable` comments added
- No carve-out abuse (no `*Raw` field added except where genuinely
  third-party-event passthrough; no rename-to-guard tricks)
- The reference patterns from the audit worktree are NOT committed; only
  the cleanup-pass-derived contract authoring is committed.
