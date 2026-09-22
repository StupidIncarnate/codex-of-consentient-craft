# Cleanup run — handoff

Master is at `6179ca3d9`. A full ward passes all 17 packages: lint, typecheck, unit, integration, e2e. The work below landed across three merges.

## Decisions waiting on you

These are the things no agent may decide.

1. **The sign-off contracts.** `signoffContract`, `signoffTracksStatics` and `signoffTrackContract` stay standing. All three are live production dependencies. `scrolls/orcha-changes/26-signoff-retirement.md:229` says: "The conductor decides; until then, carry the enum unchanged and let session 6 read it exactly as today". Blocked: the third step of story 26.
2. **Story 26's holes have no owner.** `quest-summary-build-transformer.ts` hardcodes per-track `confirmed` to 0 and `unconfirmable` to `[]`. `qa-checklist-build-transformer.ts:119` ignores its `track` parameter and returns every unit as remaining, so the checklist gates on nothing. Story 27 cannot fill these: its own header scopes it to `@dungeonmaster/web`, and both transformers live in `@dungeonmaster/orchestrator`. No document in the set targets either file. A third, unplanned story is needed.
3. **Author-only enforcement.** `scrolls/orcha-changes/28-independent.md:202` says: "An open question blocks 28c-1 — OPEN, the conductor decides. Is author-only enforcement prompt text, or a real mechanism?" Blocked: units 18 through 21 of the 27/28 plan (the verifyByHuman flag, the human-check verificationMethods value, the automatability block, the citation kind panel).
4. **Two siegelense items.** Item 5c states the decision is this pass's: "Build it ... Or delete it". Item 9c depends on the same unresolved question.
5. **The row disambiguator format.** Execution rows now render `scope (session)` when two rows share a scope. The parentheses format is an agent's design choice, not specified by 27a. Every later 27 unit builds on it, so changing it is cheapest now.

## Defects found and fixed

These were not on the itinerary; they surfaced during it.

| Defect | Where | What it caused |
|---|---|---|
| `packageNames` default dropped | `quest-summary-build-transformer.ts` | an undefined key forwarded into a strict parse under exactOptionalPropertyTypes |
| Reading a retired sign-off field | `invalidation-apply-layer-broker.ts` | a typecheck break; the clearing mechanism is obsolete by design per HANDOFF.md:99-104 |
| Raw ENOENT leaking to callers and users | `quest-find-quest-path-broker.ts:63` | an unguarded readdirSync where the file's own per-guild loop guards the same call |
| Entry step stamped from the wrong family | `quest-build-relay-graph-broker.ts:85,93` | "step `carve` is not declared in family `codeweaver`", then the quest blocks |
| The same defect latent in hydration | `quest-hydrate-broker.ts` | a hydrated quest's first work item carried no step at all |
| A nested chain's body entry rendering twice | `collect-subagent-chains-transformer.ts` | an entry consumed into a chain stayed in the buffer and flushed again as an orphan |
| The adversarial walker never signalling back | `siege-adversarial-walker-statics.ts` | a prompt-kind step terminates only via signal-back; its prompt forbade the call, so orphan recovery ran to maxResets 3 and the quest blocked |
| Create-guild inputs misaligned | `guild-empty-state-widget.tsx` | centring each row independently pushed the wider path row's left edge out by 37.875px, measured |
| A test-isolation leak | the server integration suite | a ZodError threw ahead of restore(), handing the next case a DUNGEONMASTER_HOME with no guilds directory |

Three of these are the same shape — an entry step or family taken from a hardcoded default rather than resolved from the item's own family.

## Two traps worth remembering

1. **Lint reads compiled statics.** The ESLint rules import `@dungeonmaster/shared/statics` at module load and ESLint sets no source condition. A worktree carrying a `dist` older than its source fails lint on rules the source already changed. One run tonight showed 13 files failing a rule master had already relaxed; a build cleared all 13 and two integration failures with them.
2. **Web e2e serves the compiled bundle.** Playwright serves `packages/web/dist`. An uncommitted widget change is invisible to a browser test until that package is built. A layout assertion measured a 37.875px failure against a fix that was already in the source.

## What is queued

The 27/28 plan and the siegelense plan are large and mostly unstarted. The 27/28 plan holds units across both documents, four of them blocked on decision 3. The siegelense plan holds items across three states, with most actionable.

From 27/28: execution row identity (unit 1), the dead orchestration phase contract and dag transformers (unit 16), the slot manager and browser-walk documentation (unit 17), the hydration step field (unit 22).

From siegelense: the nested chain double render, the create-guild alignment with a measured browser assertion, the siege-driver lane retirement with every referencer repointed, and the adversarial walker fix.

## Known loose ends

- Roughly a dozen siegelense files carry provenance JSDoc citing the retired prototype's line numbers. Those citations point at nothing.
- `packages/siegelense/src/statics/driver/driver-statics.ts` still cites `packages/web/test/siege-driver/siege-lane.ts` in a comment.
- The lint rule `banned-package-path-names-transformer` does not catch a bare `@scope/name` used as data. The fix is broker-level, not transformer-level: `rule-no-hardcoded-package-names-broker.ts` passes only the literal's own text, so an import specifier and a hardcoded data literal are byte-identical. The broker must withhold literals whose parent is an ImportDeclaration, ImportExpression or require() call. A transformer-only fix was built and empirically flagged legitimate imports, so it was reverted.
- `docs/quest-role-paths.md` does not list `siege-adversarial-walker`, though the project guide makes per-role path coverage mandatory.
