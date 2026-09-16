# Chunk 5 — addressing, and the steps that are new

The KEY — a listing, not a selector — with element-bound refs, four columns and the whole flag set; the
four-rung ladder that ends at `dom`; the settle detector that ends a step when the page is done; `before` as
the substrate every injection stands on; and the sixteen step verbs the spec names and this package does not
have. Everything here lives INSIDE `run`'s `steps` array. **A step is a value in a batch, never a call**
(spec line 1698: "Steps are DATA inside `run` instead: the call surface is bounded, the step surface is
open"), so nothing in this chunk adds, removes or renames a `dungeonmaster siegelense` subcommand.

**All paths in this file are relative to the worktree root
`/home/brutus-home/projects/codex-of-consentient-craft/worktrees/siegelense`.** Never the main checkout.

Coverage is tracked in `scrolls/seigelense/build-ledger.md`. **This plan does not edit that file** — §8 lists
the rows it expects to move and the ledger's owner moves them.

Chunk 2 is `plans/chunk-02-driver-and-batch.md` and chunk 3 is `plans/chunk-03-read-path-and-perception.md`.
Every signature quoted below was read off disk in this worktree after chunk 3 landed; where a plan and the
delivered code disagree, **the code wins** and this file carries the code's shape.

**Chunk 4 is being planned in parallel** (`plans/chunk-04-cli-surface.md`) and owns the move of seven calls
from MCP tools to `dungeonmaster siegelense <call>` subcommands. Nothing here touches `packages/mcp`,
`packages/cli`, `flows/siegelense/siegelense-flow.ts`, or any responder under `responders/siegelense/` except
`responders/siegelense/driver/`, which is the driver's own socket loop and is not a surface. If a merge
conflict appears between the two chunks it is in the driver responder, and this chunk's edit there is
additive: three more accessors threaded down, no route table touched.

---

## 1. Scope

### Delivered by this chunk

| Spec section | Line | What lands |
|---|---|---|
| Addressing: a listing, not a selector | 345 | The whole key: element-bound refs, `within` scoping, document order, own text nodes, the four-rung naming ladder, four columns, the complete flag set, truncation reported never silent |
| The `attrs` column — what the element DECLARES | 447 | `href` as `→ /path` with `↗` for a new tab, `data-*`, `maxlength`/`pattern`/`required`, `type=`, `title`; a per-row budget that reports what it dropped; runtime-looking values DROPPED; `className` excluded and never added |
| "Does this element have a click handler?" | 488 | The negative half, in code: `not-tabbable` is a labelled PROXY; listeners are a `dom` field over CDP and never a key row; nothing infers a dead control |
| Two key-level readings, which are not row flags | 518 | The duplicate-testId line under the key; `role` beside the tag in the element column |
| What is deliberately NOT computed, and why | 535 | §2's own "What this chunk must NOT build" list — nine lines, each one a thing an agent will otherwise build |
| `dom` is the ESCAPE HATCH | 602 | The ladder (`look` → `look { within }` → `box` → `dom`) and `dom`'s three guards: own text unless `text: 'full'`, a `fields:` projection, a cap that reports the true count |
| Settling: a step ends when the page is DONE | 781 | The network + paint + DOM triple, the repeating-request discount, a CEILING not a timeout, the settle state reported on every acting step's reading |
| Instrumentation: run a script before the page's | 816 | The `before` step over `addInitScript` |
| Computed findings: on the key's rows | 824 | The geometry checks ride the key row. **No separate command is built, and that is the whole decision** |
| Time: what is decidable, and what is not | 839 | `hold` — N frames at an interval, which differ, a binary verdict. `video` — a screencast for a human and the trail, never read back. **Nothing grades motion** |
| Survival: what a stress tester needs | 974 | `health` as one reading with one verdict line, INCLUDING the server logs; the three attacker-serving key columns; `request` and `file` as the browserless attack surface |
| Resetting: three layers | 1017 | `page` / `state` / `instance`, each declaring what it keeps; named snapshots with an explicit `to`; the automatic `run_N:start`/`run_N:end` pair; the diff reported; the snapshot covering STATE only |
| 4A · Readings, and what a step may never do | 1615 | Every new verb returns a READING; no new verb picks among matches; the lint rule's existing scope covers every file this chunk writes |
| 4A · Addressing: the key, refs, the map | 1629 | Every row of that table except the map's two (1657, 1658), which stay deliberately unbuilt |
| 4A · Perception: shots, pixelChange, animation | 1660 | `video` (row 1681) and the `hold`-stays-live rule (row 1679). `elements` (2714) joins `shot` and `pixelChange` on every acting step |
| The rule that governs every targeting step | 2078 | The REF half, which chunk 2 could not build: a candidate row carries a real `ref`, and a ref answers `stale` rather than a silent miss |
| Holding the no-pick rule mechanically | 2117 | Not a new lint rule — the existing `@dungeonmaster-local/ban-locator-pick` is already scoped to `packages/siegelense/src/brokers/step/**`, which is where every file this chunk writes lands. §3 adds the DERIVED test that catches a new verb forgetting the door |
| Refs are for DRIVING. Selectors are for RECORDING. | 2141 | A ref minted by `look`, resolvable only by the instance that minted it, invalidated by navigation, `reset` and restart — held by the MECHANISM in §3, not by prose |
| Steps that exist today and are kept | 2501 | The seven not yet built: `look`, `key`, `paste`, `box`, `dom`, `storage`, `file` |
| Steps that are new | 2535 | All eleven: `look`, `before`, `health`, `reset`, `snapshot`, `seed`, `until`, `hold`, `video`, `request`, `resize` |
| What every acting step returns | 2704 | `elements` — the third field, which needed `look` |
| A worked batch | 2721 | `as` naming a step's output and `{name.field}` reading it back |
| Interleaving recipes and steps | 2846 | `seed` placeable anywhere, composed by explicit parameters, with a page already open. **The MECHANISM only** — the catalogue is empty; see §5 |
| Cycles — run, snapshot, collect, repeat | 2895 | The two cycle shapes, which needed `snapshot` and `reset` |

### Deliberately deferred

| Deferred | To | Why it is safe to wait |
|---|---|---|
| The numbered MAP | last, or never | Spec 1658: "`look` omits the field until it ships, then returns it only on `map: true`… An absent field is honest where an empty one invites a session to wonder what went wrong." The one trial arm that had it rendered three and opened none. `keyListingContract` has NO `map` key — absent, not null |
| The RECIPE CONTENT | the recipe chunk (Part 7 items 3 / 3a) | `packages/siegelense-recipes/src/` holds one scaffold statics and nothing else, confirmed by reading `siegelense-recipes-statics.ts`. This chunk builds `seed`'s whole mechanism — resolution, the `as` binding, `{name.field}` substitution — and the catalogue it resolves against is empty, so `seed` can only answer `RecipeUnknownError` naming the empty catalogue. That error is a real, testable answer; a `seed` that pretends is not |
| Server-side failure injection | Part 7 item 12 | Spec 996: "What is NOT drivable is server-side failure — a 500, a hang, a dropped socket." This chunk gives the attacker `request`, `file`, `key`, `paste` and `resize`; the injection mechanism is a lane change, not a step |
| `snapshots` as a CALL, `prune`, retention of video | the retention chunk | `snapshot` the STEP and `snapshotListBroker` land here; the `snapshots { instance }` CALL is one of the six unbuilt calls and belongs with whoever registers them. The broker it would call exists after this chunk |
| Grading animation quality | **never — by design** | Spec 1680: "**Nothing in this system grades animation quality.** `hold` detects NON-SETTLEMENT, a binary." Building it later is not deferral, it is the defect |
| Per-step video FILES | see §3's video decision | Playwright writes a context's video only when the context closes, so a per-step `.webm` is not reachable mid-batch. The window is MARKED instead, and the file lands at `kill` |

### What this chunk must NOT build

**Each of these is a line of its own because someone will otherwise build it, and the spec says so in its own
words.** A reviewer grading this chunk checks that none of them exists.

1. **No sibling rect-intersection overlap.** Spec 539: "it is n² over the page, and it is the one thing the
   MODEL'S EYE is reliably good at."
2. **No per-row event listeners.** Spec 540: "React delegates to the root, so a per-element answer is 'none'
   for every button in this app." Listeners are a `dom` field (`fields: ['listeners']`) over CDP, opt-in, for
   one named selector, and nowhere else.
3. **Nothing infers a dead control from a listener count.** Spec 516: "The click is the test." A dead control
   is `pixelChange: 0%` beside `+0 -0 moved 0` and zero exchanges, measured.
4. **No z-index or stacking-context analysis.** Spec 541: "`covered by N` already answers the question a user
   would have, and the rest is a rabbit hole with no defect class behind it."
5. **Nothing about motion.** Spec 542, and spec 852-854's own three `no` rows: smoothness, jank, frame drops
   and easing are not decidable here and no field reports them.
6. **`className` is not a key column.** Spec 1645. It is reachable as `dom { fields: ['className'] }` and
   nowhere else.
7. **`not-tabbable` is not built on a listener check.** Spec 512: it is `cursor: pointer` on a non-focusable
   tag with no `tabindex`, "a proxy honestly labelled", and its own reading says so.
8. **No partial-blank threshold.** Spec 756: "Full-blank only… The key already answers that one: no content
   rows under the container that should have them."
9. **No new flag that fires on most rows.** Spec 544: "a flag earns its place by being ABSENT on most rows. A
   flag that fires everywhere is a column." `keyStatics` carries this rule as a comment above the flag list,
   and a new flag is a change to that file, where the rule is.

---

## 2. The contract surface, up front

**Every return is a branded contract; inputs may take a raw `string`.** All of these live in
`packages/siegelense/src/contracts/<domain>/` as `<domain>-contract.ts` + `<domain>-contract.test.ts` +
`<domain>.stub.ts`.

Reused unchanged from `@dungeonmaster/shared/contracts`: `contentTextContract`, `fileNameContract`,
`absoluteFilePathContract`, `filePathContract`, `timeoutMsContract`, `adapterResultContract`,
`arrayIndexContract`, `networkPortContract`. Reused unchanged from this package: `epochMsContract`,
`instanceIdContract`, `runIdContract`, `stepIndexContract`, `selectorContract`, `nodeLabelContract`,
`stepExpectationContract`, `locatorStateContract`, `urlPathContract`, `readingCountContract`,
`hexColourContract`, `pixelChangeContract`, `httpMethodContract`, `stepRangeContract`, `logLevelContract`,
`serverLogWindowContract`, `laneSessionContract`, `browserSessionContract`.

### Branded primitives

| Contract | Brand | Schema | Owner |
|---|---|---|---|
| `refContract` | `Ref` | `z.number().int().positive()` — an element-bound handle, minted by `look`, resolvable only inside the instance that minted it | W4 |
| `elementFlagContract` | `ElementFlag` | `z.enum(keyStatics.flags.all)` — **derived from the statics, never a second list** | W5 |
| `snapshotNameContract` | `SnapshotName` | `z.string().min(1).regex(…)` — a manual name, or the automatic `run_N:start` / `run_N:end` form | W7 |
| `resetLevelContract` | `ResetLevel` | `z.enum(['page','state','instance'])` | W7 |
| `bindingNameContract` | `BindingName` | `z.string().min(1)` — the `as` on a step, and the head of `{name.field}` | W14 |
| `domFieldContract` | `DomField` | `z.enum(domStatics.fields.all)` — `count`, `text`, `rect`, `className`, `attributes`, `listeners`, `html` | W9 |
| `holdVerdictContract` | `HoldVerdict` | `z.enum(['nothing-changed','still-changing'])` — **two members, and there is no third**, because a third is an opinion about motion | W6 |
| `healthVerdictContract` | `HealthVerdict` | `z.enum(['HEALTHY','DEGRADED','DOWN'])` | W6 |
| `settleStateContract` | `SettleState` | `z.enum(['settled','ceiling-hit'])` | W6 |
| `untilConditionKindContract` | `UntilConditionKind` | `z.enum(['visible','response','file','predicate','console'])` | W10 |

### Object contracts

| Contract | Fields | Owner |
|---|---|---|
| `attrPairContract` | `{ name: ContentText; value: ContentText }` — one rendered attr, already budgeted and already runtime-id-filtered | W5 |
| `keyRowContract` | `{ ref: Ref; depth: ArrayIndex; testId: ContentText \| null; tag: ContentText; role: ContentText \| null; domId: ContentText \| null; sibling: ContentText \| null; text: ContentText \| null; value: ContentText \| null; placeholder: ContentText \| null; attrs: readonly AttrPair[]; attrsDropped: ReadingCount; flags: readonly ElementFlag[]; flagDetail: Readonly<Record<string, ContentText>> }` | W4 |
| `keyListingContract` | `{ within: Selector \| null; rows: readonly KeyRow[]; duplicates: readonly ContentText[]; truncated: readonly ContentText[]; rendered: ContentText }` — **no `map` key at all** | W4 |
| `elementDeltaContract` | `{ added: ReadingCount; removed: ReadingCount; moved: ReadingCount; under: ContentText \| null; rendered: ContentText }` — `+7 under GUILD_ADD_MODAL, -0, moved 2` | W5 |
| `settleReadingContract` | `{ state: SettleState; elapsedMs: EpochMs; stillBusy: readonly ContentText[]; discounted: readonly ContentText[]; rendered: ContentText }` | W6 |
| `holdReadingContract` | `{ frames: ReadingCount; differing: ReadingCount; verdict: HoldVerdict; spanMs: EpochMs; shots: readonly AbsoluteFilePath[]; rendered: ContentText }` | W6 |
| `healthReadingContract` | `{ verdict: HealthVerdict; rootPresent: boolean; blank: boolean; blankColour: HexColour \| null; consoleErrors: ReadingCount; non2xx: ReadingCount; serverErrors: ReadingCount; since: ContentText; shot: AbsoluteFilePath \| null; rendered: ContentText }` | W6 |
| `snapshotListingContract` | `{ name: SnapshotName; createdAtMs: EpochMs; automatic: boolean; bytes: FileSizeBytes; fileCount: ReadingCount }` | W7 |
| `resetReadingContract` | `{ level: ResetLevel; restored: SnapshotName \| null; undid: { files: ReadingCount; added: ReadingCount; modified: ReadingCount; removed: ReadingCount }; notCleared: readonly ContentText[]; rendered: ContentText }` | W7 |
| `requestReadingContract` | `{ method: HttpMethod; url: ContentText; status: ReadingCount \| null; durationMs: EpochMs; requestBody: ContentText \| null; responseBody: ContentText; truncated: boolean }` | W8 |
| `fileReadingContract` | `{ requested: ContentText; resolved: AbsoluteFilePath; relativeTo: AbsoluteFilePath; exists: boolean; kind: ContentText \| null; bytes: FileSizeBytes \| null; modifiedAtMs: EpochMs \| null; binary: boolean \| null; truncated: boolean \| null; text: ContentText \| null; entries: readonly ContentText[] \| null; entryCount: ReadingCount \| null }` | W8 |
| `storageReadingContract` | `{ origin: ContentText; local: Readonly<Record<string, ContentText>>; session: Readonly<Record<string, ContentText>> }` | W8 |
| `boxReadingContract` | `{ ref: Ref; x; y; width; height: PixelCount; viewport: { width; height: PixelCount }; visible: boolean; inViewport: boolean }` | W9 |
| `domNodeContract` | `{ index: ArrayIndex } & the projected fields` — every field NULLABLE, because `fields:` projects | W9 |
| `domReadingContract` | `{ target: Selector; count: ReadingCount; showing: ReadingCount; capped: boolean; textMode: ContentText; nodes: readonly DomNode[] }` | W9 |
| `untilReadingContract` | `{ kind: UntilConditionKind; satisfied: boolean; waitedMs: EpochMs; observed: ContentText \| null }` | W10 |
| `seedReadingContract` | `{ recipe: ContentText; produced: Readonly<Record<string, unknown>>; rendered: ContentText }` | W10 |

### The step union grows from six members to twenty-two

`stepContract` (`contracts/step/step-contract.ts`) stays a `z.discriminatedUnion('step', …)` with every member
`.strict()` for the reason its own header already gives. **Every member keeps `node` and `expect`; every member
gains an optional `as: BindingName`** (spec 2741: "`as` names a step's output; `{name.field}` reads it back"),
and every TARGETING member gains `ref: refContract.nullable()` beside its existing `target`/`within`.

```
// existing six, each gaining `ref` where it targets and `as` everywhere
{ step: 'goto',       path, as? }
{ step: 'waitFor',    target?, within?, ref?, state, timeoutMs?, as? }
{ step: 'click',      target?, within?, ref?, timeoutMs?, as? }
{ step: 'type',       target?, within?, ref?, value, timeoutMs?, as? }
{ step: 'screenshot', name, as? }
{ step: 'eval',       source, as? }

// kept but unbuilt (spec 2501)
{ step: 'key',        press: ContentText, as? }
{ step: 'paste',      target?, within?, ref?, value?, filePath?, timeoutMs?, as? }
{ step: 'box',        target?, within?, ref?, as? }
{ step: 'dom',        target: Selector, fields?: readonly DomField[], text?: 'own' | 'full', limit?, as? }
{ step: 'storage',    prefix: ContentText, as? }
{ step: 'file',       path: ContentText, as? }

// new (spec 2535)
{ step: 'look',       within?: Selector, depth?, as? }
{ step: 'before',     source: ContentText, as? }
{ step: 'health',     as? }
{ step: 'reset',      level: ResetLevel, to?: SnapshotName, reseed?: ContentText, as? }
{ step: 'snapshot',   as: BindingName }                       // `as` is REQUIRED here — see below
{ step: 'seed',       recipe: ContentText, params?, as? }
{ step: 'until',      visible?|response?|file?|predicate?|console?, timeoutMs?, as? }
{ step: 'hold',       frames, everyMs, as? }
{ step: 'video',      action: 'start' | 'stop', as? }
{ step: 'request',    method, path, body?, headers?, as? }
{ step: 'resize',     width, height, as? }
```

**`as` does double duty on `snapshot`, deliberately, and it is stated here because it is the one place the
spec's own two sentences overlap.** Spec 2588 writes `{ step: 'snapshot', as: 'clean' }` and spec 2741 writes
"`as` names a step's output". Both are satisfied by one rule: **`as` is the binding name, and a `snapshot`'s
output IS its own name**, so `{snapshot.name}` reads back what `as` set. That is why `as` is the only required
field on the `snapshot` member: a snapshot with no name is a point `reset` cannot return to.

**`until` takes exactly one of five conditions**, enforced by a `.refine()` on the member with a message
naming all five. A `console` condition is a STRING pattern, not a regex literal: spec 2625 writes
`{ step: 'until', console: /hydrated/ }`, and a batch crosses a JSON socket, where a `RegExp` does not
survive. The contract takes the source string and the broker compiles it with the `u` flag, matching how
`resultsStatics.patterns` already holds its four patterns as `{source, flags}` pairs.

**A targeting member takes `target` OR `ref`, never both and never neither** — a second `.refine()`, with the
message quoting spec 2523: "A ref is only meaningful after the `look` that minted it, in the same page state."

### Errors

| Class | Carries | Thrown when | Owner |
|---|---|---|---|
| `RefStaleError` | `ref`, `mintedIn` | the element a ref bound to has detached, or a navigation / `reset` / restart wiped the registry. **The message says `stale`, and says which of the four boundaries it crossed** | W11 |
| `RefUnknownError` | `ref`, `highestMinted` | a ref number that was never minted in this instance — a ref carried across an instance boundary. Names the four boundaries (spec 2160) | W11 |
| `SnapshotUnknownError` | `name`, `available` | `reset { to }` named a snapshot that does not exist. Spec 2602: "A `reset` naming one that does not exist is an error, not a silent fall-back to the nearest" | W11 |
| `RecipeUnknownError` | `recipe`, `available` | `seed` named a recipe the catalogue does not hold. **With an empty catalogue this names the empty catalogue, which is a real answer** | W12 |
| `UntilCeilingHitError` | `kind`, `condition`, `waitedMs`, `observed` | an `until` reached its ceiling. Mirrors `WaitForCeilingHitError` so `runExecuteStepLayerBroker` reports `status: 'timeout'` for both | W12 |
| `ResetLevelUnsupportedError` | `level`, `reason` | `reset { level: 'instance' }` against a driver with no relaunch accessor threaded, or `level: 'page'` against a browserless lane. **Names the lane's spec**, matching `BrowserStepUnsupportedError` | W12 |
| `VideoNotRecordingError` | `action`, `specName` | `video { action: 'stop' }` with no `start`, or a `video` step against a lane whose context records nothing | W12 |

### Statics

| Statics | Holds | Owner |
|---|---|---|
| `stepStatics` (**rewrite**) | `verbs.all` — all twenty-two, the closed set · `verbs.acting` — the verbs that change the page and therefore capture and settle unasked · `verbs.targeting` — the verbs that resolve an element · `verbs.browser` — the verbs that need a page · `verbs.settling` — the subset of `acting` that waits for settle · `defaults` unchanged | W1 |
| `keyStatics` | `flags.all` — the complete flag list in spec order, **each with the comment that says what it answers and how it is computed** · `flags.rule` — the absent-on-most-rows rule, as the comment above the list · `excluded.tags` — `style`, `script`, `meta`, `link`, `title`, `head`, `noscript` · `naming.ladder` · `limits` — `maxRows`, `maxDepth`, `textChars`, `attrsPerRow`, `attrValueChars` · `attrs.allowed` — `href`, `data-*`, `maxlength`, `pattern`, `required`, `type`, `title` · `attrs.runtimeIdPattern` — `{source, flags}` · `contrast.threshold` · `arrows` — `→` and `↗` | W2 |
| `domStatics` | `fields.all` · `defaults.text: 'own'` · `limits.matchCap`, `limits.textChars` | W2 |
| `settleStatics` | `quietWindowMs` · `ceilingMs` · `pollMs` · `repeat.minOccurrences`, `repeat.intervalTolerancePercent` | W3 |
| `healthStatics` | `verdictRules` — which readings produce DEGRADED versus DOWN · `rootSelector` | W3 |
| `resetStatics` | `levels` — the three, each with what it clears and what it KEEPS, verbatim from spec 1044-1048 · `notCleared.page`, `notCleared.state` — the exact strings a reading reports · `automatic.startSuffix: ':start'`, `automatic.endSuffix: ':end'` · `retention.keepMostRecent` | W3 |
| `locationsStatics.siegelense` (**in `@dungeonmaster/shared`**) | adds `videoDir: 'video'` | W1 |
| `evidenceFileStatics` | adds `extensions.video: '.webm'` | W1 |
| `driverStatics` | adds `boot.snapshotsSuffix: '.snapshots'` and `hold.maxFrames` | W1 |

---

## 3. Five decisions this chunk takes, each with the mechanism behind it

### The ref registry lives in the PAGE, not in Node — which is what makes the four boundaries physical

Spec 2152: "**A ref is scoped to ONE INSTANCE, and inside it to one page state.** The instance holds the
element handles, so the instance is the only thing in the system that can resolve a ref at all." Spec 2184:
"**Navigation, `reset` and an instance restart all invalidate every ref.** A ref used after one of those
answers `stale` — never a different element."

A registry held in Node has to be invalidated by someone REMEMBERING to invalidate it, on four different
paths. A registry held in the page's own JS realm is invalidated by the browser: a navigation replaces the
realm, `reset level: 'page'` reloads, `reset level: 'instance'` replaces the context. **So
`window.__siege.refs` is an array of Elements installed by an `addInitScript` at session creation, and a ref
is an index into it.**

Three properties fall out, and each is one of the spec's own requirements met by construction rather than by
care:

- **A ref binds to an ELEMENT, not a row number** (spec 2183). A `look` walks the DOM and, per element, does
  an identity lookup in `window.__siege.refs`; a hit REUSES that number, a miss pushes and mints. So
  recomputing a listing never renumbers what is still there. All of it inside ONE `page.evaluate`, so there
  is no per-element round trip.
- **A ref answers `stale`, never a different element** (spec 2114). `refs[n]` still holds the element after a
  detach; `element.isConnected` is `false`, and that is `RefStaleError`. A ref past the array's end is
  `RefUnknownError` — the cross-instance case.
- **Navigation invalidates.** `addInitScript` re-runs on every document, so the array comes back EMPTY, and
  every previously minted ref is past the end. Nothing has to remember anything.

Driving by ref: `page.evaluateHandle` returns the element as a `JSHandle`, `.asElement()` gives an
`ElementHandle`, and the handle's own `click`/`fill`/`boundingBox` take it from there. **`ElementHandle` is
used only for a ref**; a `target` selector keeps going through the locator path chunk 2 built, which is what
keeps Playwright's strict mode doing the no-pick work.

### Every new targeting verb inherits the no-pick rule — and a DERIVED test is what makes that true

Chunk 2 built the rule for six verbs, and it holds today. But `run-verb-layer-broker.ts:43-45` gates the door
on a hardcoded narrowing:

```ts
if (
  isTargetingStepGuard({ step }) &&
  (step.step === 'waitFor' || step.step === 'click' || step.step === 'type')
) {
```

**That disjunction is exactly how a new targeting verb skips the door**: `box`, `paste` and `dom` all target,
and a seventh clause that nobody adds is a silent `.first()` by omission. Four changes remove the possibility
rather than re-documenting it:

1. **`isTargetingStepGuard` derives from `stepStatics.verbs.targeting`** instead of checking for a `target`
   property, so one statics decides.
2. **`stepTargetOfStepTransformer`** extracts `{ target, within, ref }` off ANY member that carries them, so
   `runVerbLayerBroker` has ONE branch with no verb names in it.
3. **`stepTargetResolveBroker` gains a `ref` arm**, delegating to `stepRefResolveBroker`. One door for both
   handle kinds, and the ambiguous error's candidates now carry a REAL `ref` — which is the half chunk 2 could
   not build and which spec 2098-2100 has been describing since.
4. **`step-statics.test.ts` derives the targeting set from `stepContract.options` and asserts it matches
   `stepStatics.verbs.targeting` exactly.** A new union member carrying `target` or `ref` that its author
   forgot to list FAILS A UNIT TEST, naming the verb. That is the mechanical hold the brief asks for, and it
   costs one test.

The LINT half needs nothing: `@dungeonmaster-local/ban-locator-pick` is registered in `eslint.config.js` and
scoped by `isLocatorPickScopeFileGuard` to `packages/siegelense/src/brokers/step/**`. **Every verb broker this
chunk writes lands inside that scope**, so `.first()`/`.last()` is refused in all sixteen without touching the
rule. Say so in the commit rather than widening the rule; widening a rule people already over-trust is the
failure `siegelense-recipes.md` warns about.

### The settle detector is a triple, and the repeating-request discount is what makes it usable HERE

Spec 787: "an acting step returns when the page SETTLES, on three signals together" — network, paint, DOM.
Spec 795: "**A poller never goes quiet, and that is the case that matters here.** This app polls."

Where each signal is measured, and why:

| Signal | Measured | Where |
|---|---|---|
| network | in-flight requests, minus the discounted ones | **Node**, off Playwright's `request` / `requestfinished` / `requestfailed` events. The session adapter already listens to `response` and `requestfailed`; it gains `request` and `requestfinished` |
| DOM | a mutation counter bumped by a `MutationObserver` | **the page**, installed by the same `addInitScript` that installs the ref registry |
| paint | a pending-rAF flag, cleared in the frame callback | the page, same script |

**The discount, stated precisely so an implementation cannot drift:** a request is keyed by method plus path.
When that key has been seen `settleStatics.repeat.minOccurrences` times and the gaps between successive
starts agree within `repeat.intervalTolerancePercent`, it stops counting toward busy — and the settle reading
NAMES it in `discounted`, so a wait that was long because of a poller says which poller.

**Ceiling, not timeout** (spec 812). The reading is `{ state: 'ceiling-hit', stillBusy: [...] }`, and
`stillBusy` is the actionable part: spec 806's own example line, `never settled — GET /api/rate-limits every
1000ms (discounted), DOM still mutating at 10s`, is a defect report. **A ceiling hit does NOT fail the step**
— it is a reading, not a verdict, and the founding rule (spec 1623) binds here as everywhere. The step's
`ok` is decided by the verb, and `settle.state` rides beside it.

`settle` becomes a nullable field on `stepReadingContract`, `null` for every non-settling verb.

### `video` marks a WINDOW, because Playwright writes a context's video only when the context closes

Spec 2640: "**`video`** — a screencast across a batch, for a HUMAN to watch and for the evidence trail. No
step reads it back and no verdict is taken from it," with `{ step: 'video', action: 'start' }` … `{ action:
'stop' }`.

**Playwright's video is configured on `browser.newContext({ recordVideo })` and the `.webm` is flushed when
the context closes.** `page.video().saveAs()` waits for the page to close. There is no start/stop mid-context,
and the alternatives are worse: a new context destroys the page state the batch is standing in, and a CDP
screencast hands back frames with no encoder to assemble them.

So: **the lane's context records from boot into `<evidencePath>/video/`, and the `video` step writes a
MARKER** — `start` records the step index and the millisecond offset from context creation, `stop` closes the
window and its reading names both offsets. `lane-teardown-broker` closes the context, Playwright flushes the
file, and `killResultContract` gains the video path so the kill return says where it went.

**Two costs, stated rather than discovered:**

- Recording is always on for a browser lane. `driverStatics` carries the knob and `laneSpecStatics` decides
  per spec; a browserless spec records nothing and a `video` step against one throws
  `VideoNotRecordingError` naming the spec, exactly as a browser step does.
- **The file is one per instance, not one per step**, so spec 902's example path
  `…/instances/inst_7f3a/video/step9.webm` is not what this produces. The marker's offsets are what a person
  seeks to. This is a deliberate deviation with a mechanical reason, and the `video` step's own PURPOSE header
  states it so the next reader does not re-litigate it.

### `reset level: 'instance'` needs a lane the run executor can REPLACE — threaded, never imported

The state/evidence boundary spec 1055 demands is **already physical in this build, and that is the finding
that makes `snapshot` cheap.** `locationsInstanceHomePathFindBroker` puts the home at
`<os.tmpdir()>/dm-siege-<instanceId>`; `lane-boot-broker.ts:135` writes `api-server.log` and `web-server.log`
into `evidencePath`, which is `<repoRoot>/.siegelense/…/instances/<id>/`, a different tree entirely. So:

> **A snapshot is a recursive copy of `homePath` and nothing else. Logs, buffers, shots, the transcript and
> the run returns are all under `evidencePath` and are never touched by any reset at any level.**

No exclusion list, no per-file rule, nothing to get wrong later. Snapshots live at
`<os.tmpdir()>/dm-siege-<instanceId>.snapshots/<name>/` — a SIBLING of the home, not inside it, or a
`level: 'state'` restore would clobber the snapshots while restoring from one. Teardown removes both.

`level: 'instance'` is the hard one. It means tearing the lane down and booting a new one, and the driver —
not any broker — owns the lane: `driverSessionState` holds it, and `brokers/` may not import `state/`. The
established answer in this package is the accessor thread chunk 3 built for `lastShotPath`
(`driver-serve-layer-responder` reads state fresh per request and hands the accessor down through
`driverHandleRequestBroker` → `runExecuteBroker` → `runExecuteStepLayerBroker` → `stepDispatchBroker`). So:

- `relaunchLane: () => Promise<LaneSession>` is threaded the same way, by W40.
- `runExecuteBroker` holds its lane in a **mutable field holder**, the same `cursorState` shape it already
  uses to keep `require-atomic-updates` quiet, so the steps after an `instance` reset run against the NEW
  lane.
- **Every ref minted before the reset is dead**, by construction: a new context is a new realm and a new
  empty registry. The reset's reading says so.
- `reseed` runs through `stepSeedBroker`, so it inherits the empty catalogue and its error.

**This is the highest-risk item in the chunk and it runs alone, last but one.** If the thread cannot be made
to typecheck cleanly, the fallback is `ResetLevelUnsupportedError` naming `kill` + `start` as the two calls
that do the same thing across a batch boundary — a refusal that teaches, not a silent partial.

---

## 4. Work items

**One work item writes at most THREE implementation files.** A `.test.ts`, a `.proxy.ts` and a `.stub.ts` are
mandated companions of an implementation file, not files of their own — the folder rules require them and
splitting one off is not a smaller item, it is a broken one. Where an item names three contract domains, that
is three implementation files and nine files on disk.

**Maximum five agents at once.** A wave marked `alone` runs by itself because everything after it reads what
it writes.

| Wave | Items | Parallel? |
|---|---|---|
| A | W1 · W2 · W3 | PARALLEL (3) |
| B | W4 · W5 · W6 · W7 · W8 | PARALLEL (5) |
| C | W9 · W10 · W11 · W12 · W13 | PARALLEL (5) |
| D | W14 | alone — SEQUENCE |
| E | W15 · W16 · W17 · W18 | PARALLEL (4) |
| F | W19 · W20 · W21 · W22 · W23 | PARALLEL (5) |
| G | W24 | alone — SEQUENCE |
| H | W25 · W26 · W27 · W28 · W29 | PARALLEL (5) |
| I | W30 · W31 · W32 · W33 · W34 | PARALLEL (5) |
| J | W35 · W36 · W37 | PARALLEL (3) |
| K | W38 | alone — SEQUENCE |
| L | W39 · W40 | PARALLEL (2) |
| M | W41 | alone — SEQUENCE |
| N | W42 | alone — SEQUENCE |

### Orchestrator-owned builds, and a dispatched agent must never run one

`<dungeonmaster-buildDiscipline>`: a dispatched agent does not build.

1. **After W1, before any lint in wave B**: `npm run build --workspace=@dungeonmaster/shared`. W1 adds
   `videoDir` to `locationsStatics`, and this repo's own ESLint rules import `@dungeonmaster/shared/statics`
   at module load with no `source` condition. The root `CLAUDE.md` names this as one of four build cases this
   checkout owns.
2. **Before W42**: `npm run build --workspace=@dungeonmaster/siegelense`. The driver runs COMPILED output, and
   W42's suite spawns the real `dungeonmaster siegelense driver`.
3. **Before any manual drive**: `npm run build && npm link --workspaces && npm run init`.

---

### W1 — The verb set, and the three location literals (wave A)

**Edits**

- `packages/siegelense/src/statics/step/step-statics.ts` (+ `.test.ts`) — `verbs.all` grows from six to the
  full closed twenty-two; `verbs.acting`, `verbs.targeting`, `verbs.browser` and the new `verbs.settling`
  each listed and each commented with WHY a verb is in it.
- `packages/shared/src/statics/locations/locations-statics.ts` (+ `.test.ts`) — add `videoDir: 'video'` to the
  existing `siegelense` group, which currently ends at `websocketLog: 'ws.jsonl'`.
- `packages/siegelense/src/statics/evidence-file/evidence-file-statics.ts` (+ `.test.ts`) — add
  `extensions.video: '.webm'`. **Not** into `locationsStatics`: that file's own header records why a bare
  extension there breaks lint across unrelated packages.

**Depends on** nothing.

**Tests** `step-statics.test.ts` asserts the complete `verbs.all` array with `toStrictEqual`, and asserts each
of the four subsets is a subset of `verbs.all` by deriving the check FROM `verbs.all` — never from a second
hardcoded list. `locations-statics.test.ts` extends its existing full-value assertion.

**Acceptance** the classification is checkable against the spec, not a taste call: `verbs.browser` excludes
`request`, `file`, `seed`, `snapshot` and `reset { level: 'state' }`, because spec 1011 says the attack
surface "changes shape entirely with no browser… There the attack is `request`, `file` and the process
itself, against the browserless spec."

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

> line 1011: `**And the attack surface changes shape entirely with no browser.** The off-map families are properties of the BUILT`
> line 1013: `SYSTEM rather than of any drawn flow, so `hostile-input` and `perf` coverage exists on an operational flow too — where`

---

### W2 — `keyStatics` and `domStatics` (wave A)

**Creates**

- `packages/siegelense/src/statics/key/key-statics.ts` + `.test.ts`
- `packages/siegelense/src/statics/dom/dom-statics.ts` + `.test.ts`

`keyStatics.flags.all` is the complete list from the spec's own table at lines 412-432, in that order, each
entry carrying the comment that says what it answers and how it is computed. **The rule that stops the set
growing is a comment above the list, in the file a new flag would be added to** — spec 544: "a flag earns its
place by being ABSENT on most rows."

`keyStatics.attrs.allowed` holds exactly the five rows of the spec's table at 456-462 and nothing else, and
`attrs.runtimeIdPattern` is the `{source, flags}` pair the determinism guard reads.

**Depends on** nothing.

**Tests** `key-statics.test.ts` asserts `flags.all` complete with `toStrictEqual`, asserts `excluded.tags` is
exactly the seven the spec names, and asserts `className` is in NEITHER `attrs.allowed` NOR `flags.all` — a
negative assertion that names the decision, so re-adding it fails a test rather than passing review.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the four files>`

> line 475: `**`className` is NOT in this column, and that is a decision rather than an omission.** Two reasons, and the second is`
> line 544: `**The rule that keeps this set from growing forever: a flag earns its place by being ABSENT on most rows.** A flag that`
> line 568: `- **Excluded outright:** `style`, `script`, `meta`, `link`, `title`, `head`, `noscript`; any zero-size box; anything`

---

### W3 — `settleStatics`, `healthStatics`, `resetStatics` (wave A)

**Creates** three statics under `packages/siegelense/src/statics/`, each with `.test.ts`: `settle/`, `health/`,
`reset/`.

`resetStatics.levels` transcribes spec 1044-1048's table — what each level CLEARS and what it KEEPS — because
the `notCleared` array a reset reports reads out of it, and a second copy of that table is how the two drift.

**Depends on** nothing.

**Tests** `reset-statics.test.ts` asserts all three levels complete, and asserts `levels.state.keeps` contains
the server-memory string — spec 1035 calls that row "the one that bites", and a `state` reset that claimed to
clear server memory is the confident-false-result failure.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

> line 1035: `**The middle row is the one that bites, and this repo has a concrete instance of it.** Quest mutations go through a file`
> line 1047: `| `state`    | disk, plus everything `page` clears        | **server memory**   | ~2s                        |`

---

### W4 — The key's own contracts (wave B)

**Creates** three contract domains under `packages/siegelense/src/contracts/`: `ref/`, `key-row/`,
`key-listing/`.

`keyListingContract` has **no `map` field**. Its PURPOSE must say so and say why (spec 1658), because the next
reader's instinct is to add a nullable one.

`refContract`'s PURPOSE must say what distinguishes it from a `Selector`: a ref drives, a selector records,
and the four boundaries a ref cannot cross (spec 2160-2167).

**Depends on** W2.

**Tests** `key-listing-contract.test.ts` asserts a listing with rows, duplicates and truncation lines parses
whole with `toStrictEqual`, and asserts `.strict()` REJECTS `{ map: 'x' }` naming the stray key — the test
that keeps the deferral honest.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

> line 1658: `| The numbered MAP is built LAST and is OPTIONAL — `look` omits the field until it ships, then returns it only on `map: true` | the one trial arm that had it rendered three and opened none, reporting the key was enough. An absent field is honest where an empty one invites a session to wonder what went wrong |`

---

### W5 — The column contracts (wave B)

**Creates** `element-flag/`, `attr-pair/`, `element-delta/`.

`elementFlagContract` is `z.enum(keyStatics.flags.all)` — **derived, never a second list**, the same rule
`stepVerbContract` already follows.

**Depends on** W2.

**Tests** `element-flag-contract.test.ts` uses `it.each` over `keyStatics.flags.all`, deriving the case list
from the statics. `element-delta-contract.test.ts` asserts the rendered form is exactly
`'+7 under GUILD_ADD_MODAL, -0, moved 2'` for that input, and exactly `'+0 -0 moved 0'` when nothing changed —
the second is the string spec 2716 says IS a defect report.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

> line 2714: `| `elements`    | `+7 under GUILD_ADD_MODAL, -0, moved 2` — a delta, not a fresh key                     |`
> line 2716: ``+0 -0 moved 0` beside `pixelChange: 0%` is a control that did nothing — a defect reported rather than one a session had`

---

### W6 — The perception and time contracts (wave B)

**Creates** `settle-reading/`, `hold-reading/`, `health-reading/`.

`holdVerdictContract` has **two members**. Its PURPOSE states that a third would be an opinion about motion
and that the design forbids one (spec 1680).

**Depends on** W3.

**Tests** `hold-reading-contract.test.ts` asserts both rendered verdict strings exactly —
`'NOTHING CHANGED across 4.5s'` and `'still changing at 4.5s'` — and one `INVALID:` case proving a third
verdict string is rejected. `health-reading-contract.test.ts` asserts all three verdict lines render exactly
as spec 2562-2564 writes them.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

> lines 2562-2564:
> ```
> → HEALTHY   root present · not blank · console clean · no 5xx · server log clean
> → DEGRADED  root present · console: 1 error "Cannot read properties of null"
> → DOWN      root absent · page blank (#0d0907) · server log: 3 errors since step 4
> ```

> lines 2633-2634:
> ```
> → { frames: 4, differing: 0, verdict: 'NOTHING CHANGED across 4.5s', shots: [...] }
> → { frames: 4, differing: 3, verdict: 'still changing at 4.5s',      shots: [...] }
> ```

---

### W7 — The state contracts (wave B)

**Creates** `snapshot-name/`, `snapshot-listing/`, `reset-reading/`.

`resetReadingContract.notCleared` is `readonly ContentText[]`, populated from `resetStatics.levels[level].keeps`
— **never hand-written at the call site**, so the reading and the table cannot disagree.

**Depends on** W3.

**Tests** `reset-reading-contract.test.ts` asserts the whole reading for `level: 'state'` with `toStrictEqual`,
including `notCleared: ['server memory', 'open websockets']` — spec 2576's own example.
`snapshot-name-contract.test.ts` asserts both the manual form and the automatic `run_4:start` form parse, and
that a name containing a path separator is rejected.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

> lines 2575-2576:
> ```
> → { restored: 'clean', undid: { files: 4, added: 2, modified: 1, removed: 1 },
>     NOT_cleared: ['server memory', 'open websockets'] }
> ```

---

### W8 — The I/O-verb reading contracts (wave B)

**Creates** `request-reading/`, `file-reading/`, `storage-reading/`.

`fileReadingContract` mirrors the measured prototype's own shape at
`packages/web/test/siege-driver/siege-command.ts:322-376`, including the three kinds (`file`, `directory`,
`other`) and the absent case — spec-adjacent, but the prototype's own comment there records why an absent file
is a MEASUREMENT rather than a failure, and that reasoning survives the port.

**Depends on** nothing.

**Tests** `file-reading-contract.test.ts` asserts all four shapes with `toStrictEqual`: present file, present
directory, non-regular file, absent. Four tests, four complete objects — an absent file whose `exists` is
`false` still carries `resolved` and `relativeTo`, and a contract that let those go missing would hand back a
reading nobody can act on.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

> `packages/web/test/siege-driver/siege-command.ts:337-338`: `// An absent file is the answer half of these readings are asking for, so it comes back as a` / `// measurement rather than falling to the catch below as a failed command.`

---

### W9 — The ladder's lower rungs, as contracts (wave C)

**Creates** `box-reading/`, `dom-field/`, `dom-reading/`.

`domReadingContract` carries `count`, `showing` and `capped` as three separate fields. Spec 640: "a match cap
that SAYS it capped, with the true `count` beside it… `count: 58, showing 10` is an answer; ten silent rows is
a trap."

**Depends on** W2.

**Tests** `dom-reading-contract.test.ts` asserts the capped shape renders `count: 412, showing: 10, capped:
true` and the uncapped shape `count: 3, showing: 3, capped: false`. `dom-field-contract.test.ts` uses
`it.each` over `domStatics.fields.all`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

> line 640: `| **a match cap that SAYS it capped**, with the true `count` beside it | a reading that quietly stops is the `count: 0` problem again. `count: 58, showing 10` is an answer; ten silent rows is a trap |`
> line 645: `{ step: 'dom',        target: 'body *' }        // → count: 412, showing 10, capped. Narrow this.`

---

### W10 — `until` and `seed` contracts (wave C)

**Creates** `until-condition/`, `until-reading/`, `seed-reading/`.

`untilConditionContract` is a `z.discriminatedUnion('kind', …)` of five members, and the STEP member's
`.refine()` maps its five optional fields onto exactly one of them. The `console` member takes a pattern
SOURCE string, and its PURPOSE says why (a batch crosses a JSON socket; a `RegExp` does not survive).

**Depends on** nothing.

**Tests** `until-condition-contract.test.ts` uses `it.each` over `untilConditionKindContract.options` for the
five valid shapes, plus one `INVALID:` proving two conditions at once is rejected with a message naming all
five.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

> lines 2622-2625:
> ```
> { step: 'until', response: { method: 'POST', path: '/api/quests' }, timeoutMs: 15000 }
> { step: 'until', file: 'guilds/<id>/quests/<id>/quest.json', timeoutMs: 10000 }
> { step: 'until', predicate: 'document.querySelectorAll("[data-testid=QUEST_ROW]").length === 3' }
> { step: 'until', console: /hydrated/ }
> ```

---

### W11 — The three ref-and-snapshot errors (wave C)

**Creates** `errors/ref-stale/`, `errors/ref-unknown/`, `errors/snapshot-unknown/`, each with `.test.ts`.

`RefStaleError`'s message names WHICH of the four boundaries was crossed where the driver can tell (a
navigation is knowable; a detach is not), and always ends with the recovery: run `look` again.
`SnapshotUnknownError` lists what DOES exist, because a reset naming a missing snapshot is usually a typo, and
this is the same "carry the disambiguation" rule the ambiguous error follows.

**Depends on** W4, W7.

**Tests** each asserts the complete rendered message with an anchored regex, and the complete carried fields
with `toStrictEqual`. `snapshot-unknown-error.test.ts` asserts the `available` list appears in the message —
an error that says only "not found" is the one the spec's no-silent-fallback rule exists to improve on.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

> line 2602: ``snapshots { instance }` lists what exists. A `reset` naming one that does not exist is an error, not a silent fall-back`
> line 2114: `A `ref` can never be ambiguous: it binds to one element. It answers `stale` when that element has detached, which is a`

---

### W12 — The four verb errors (wave C)

**Creates** `errors/recipe-unknown/`, `errors/until-ceiling-hit/`, `errors/reset-level-unsupported/`,
`errors/video-not-recording/`, each with `.test.ts`. **Four implementation files, over the three-file rule by
one, because all four are the same eight-line shape and splitting them costs a wave.**

`RecipeUnknownError` with an empty catalogue renders the empty catalogue explicitly — "no recipes are
installed" rather than an empty list — because an empty bracket pair reads as a bug in the error.

**Depends on** W10, W7.

**Tests** each asserts its complete rendered message with an anchored regex. `recipe-unknown-error.test.ts`
covers BOTH catalogue states: empty, and holding names.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the eight files>`

---

### W13 — The key renderer (wave C)

**Creates**

- `packages/siegelense/src/transformers/key-render/key-render-transformer.ts` + `.test.ts` —
  `({ listing }: { listing: KeyListing }): ContentText`. Rows → the text tree: ref column, indentation by
  depth, the element column (testId, tag, role, DOM id, `[n/m]`), text/value with the placeholder separate,
  attrs, flags. Plus the duplicate-testId lines and the truncation lines UNDER the key.

**This is a pure transformer and it is where the key's whole readability lives.** It is separate from the
adapter that gathers the rows precisely so the rendering is testable without a browser — which is what lets
its test assert the exact text of spec 360-377's own worked key.

**Depends on** W4, W5, W2.

**Tests** the highest-value test in the chunk: build a `KeyListing` whose rows are the ones spec 363-376 shows
and assert the rendered string **line for line**, with `toBe` on the whole block. Then:
`VALID: {an input row} => value and placeholder render as separate columns` (spec 1637: "they are different
questions"); `VALID: {a link} => renders '→ /queue'` and `{target=_blank} => renders '→ /docs ↗'`;
`VALID: {a testId under two parents} => a duplicate line under the key naming both parents`;
`VALID: {a within scope that omitted rows} => a truncation line naming the count and the container`;
`VALID: {an untagged element} => renders '(p)'`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the two files>`

> line 524: `… subagent-chain-duration appears 2× — under SUBAGENT_CHAIN_HEADER and under CHAT_PANEL`
> line 553: `**Truncation is reported, never silent.** A `within` scope or a depth limit that omits rows says so —`
> line 554: `… 12 more under CHAT_MESSAGES_AREA` — because a key that quietly stops is the `count: 0` problem wearing a different`
> line 557: `**Indentation IS scope**, so the selector reads off the tree: ref 26 is`
> line 566: `- **An untagged element prints as its tag** — `(p)`, `(span)` — and a row's parent is its nearest *testId* ancestor, so`

---

### W14 — The step union (wave D, alone)

**Edits**

- `packages/siegelense/src/contracts/step/step-contract.ts` + `.test.ts` + `.stub.ts` — six members become
  twenty-two, `as` on every member, `ref` on every targeting member, the two `.refine()`s.

**Creates**

- `packages/siegelense/src/contracts/binding-name/` — three files.

**Alone**, because every broker in waves F onward imports `Step`, and every existing `step.stub.ts` caller
moves with it.

**Depends on** W4 through W13.

**Tests** `step-contract.test.ts` uses `it.each` over `stepStatics.verbs.all` asserting every verb has a
member — **derived from the statics, so a verb in the statics with no member fails, and a member with no
statics entry fails** (the pair is what keeps the two lists from drifting). Plus:
`INVALID: {a click with both target and ref} => rejected naming both`;
`INVALID: {a click with neither} => rejected naming both`;
`INVALID: {an until with two conditions} => rejected naming all five`;
`INVALID: {a snapshot with no as} => rejected`;
`INVALID: {a goto carrying a stray key} => rejected naming the key` (the `.strict()` guarantee).

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files, plus every test the union's growth touched>`

> line 2523: `**A ref is only meaningful after the `look` that minted it, in the same page state.** A step that must survive being`
> line 2741: `**`as` names a step's output; `{name.field}` reads it back.** A seed mints runtime ids that no file contains, so later`

---

### W15 — The attrs budget and the determinism guard (wave E)

**Creates**

- `packages/siegelense/src/transformers/attrs-budget/attrs-budget-transformer.ts` + `.test.ts` —
  `({ attributes }: { attributes: readonly AttrPair[] }): { kept: readonly AttrPair[]; dropped: ReadingCount }`.
  Selects only `keyStatics.attrs.allowed`, **drops a value matching `attrs.runtimeIdPattern`**, truncates a
  long value, caps the row and reports what it dropped.

**Depends on** W2, W5.

**Tests** `VALID: {href} => kept as '→ /path'`; `VALID: {target=_blank} => the ↗ glyph`;
`VALID: {data-status=failed} => kept whole`; `VALID: {a data attr holding a uuid-shaped value} => dropped`
— this is the determinism guard and it is the one an implementation will skip, so it asserts the returned
`kept` array COMPLETE with `toStrictEqual`, proving the runtime-id row is absent rather than merely that the
count fell; `VALID: {nine attrs, cap of five} => five kept and dropped: 4`;
`VALID: {className present} => absent from kept`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the two files>`

> line 469: `**And it needs a determinism guard**, which is the part that would bite silently. A framework writes runtime ids into`
> line 471: `makes the element delta report churn on a page nothing touched, which is the exact failure the identity rules in Part 5`
> line 472: `exist to prevent. **A value that looks like a runtime id is dropped**, and the same rule that keeps recipes off`
> line 464: `**It needs a budget or it eats the key.** The key is ~243 tokens because every column is short, and attributes are the`

---

### W16 — The element delta (wave E)

**Creates**

- `packages/siegelense/src/transformers/element-delta-compute/element-delta-compute-transformer.ts` +
  `.test.ts` — `({ before, after }: { before: KeyListing; after: KeyListing }): ElementDelta`.

Compares two listings by REF, not by row position — a ref binds to an element, so a row that moved is `moved`
and not `+1 -1`. `under` names the deepest common testId ancestor of the added rows when there is one.

**Depends on** W4, W5.

**Tests** four cases straight off spec 761-766's own table:
`{40% pixels, same structure} => +0 -0` (the transformer's half: identical listings give an all-zero delta);
`{a widget appeared} => +7 -0`; `{nothing happened} => +0 -0 moved 0`;
`{something swapped for something the same size} => +3 -3`. Each asserts the COMPLETE `ElementDelta` with
`toStrictEqual`, including `rendered`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the two files>`

> lines 761-766: the pixels/elements pairing table

---

### W17 — The health verdict (wave E)

**Creates**

- `packages/siegelense/src/transformers/health-verdict/health-verdict-transformer.ts` + `.test.ts` —
  `({ reading }: { reading: HealthReading }): { verdict: HealthVerdict; rendered: ContentText }`.

**Depends on** W3, W6.

**Tests** the three verdict lines asserted with `toBe` against spec 2562-2564's exact strings, plus the
boundary cases the rules table decides: a console error alone is DEGRADED; a missing root OR a blank page is
DOWN; **server-log errors alone are enough for DOWN**, because spec 991 says that reading is "the piece
nothing surfaces today" and a health check that could not fail on it would leave the gap it exists to close.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the two files>`

> line 986: `**Solution — `health`, one reading with one verdict line:** root element present, page not blank, no new console errors,`
> line 991: `**Server logs are the piece nothing surfaces today.** The lane already opens `api-server.log` and`

---

### W18 — `{name.field}` substitution (wave E)

**Creates**

- `packages/siegelense/src/transformers/step-placeholder-substitute/step-placeholder-substitute-transformer.ts`
  + `.test.ts` — `({ step, bindings }: { step: Step; bindings: Readonly<Record<string, unknown>> }): Step`.
  Walks the step's own string fields, replaces every `{name.field}` and `{name.a.b}` with the bound value, and
  **throws naming the placeholder and the bindings that DO exist** when a name is unbound.

`lane-placeholder-substitute-transformer.ts` is the existing precedent in this package; read it and follow its
shape rather than inventing a second substitution dialect.

**Depends on** W14.

**Tests** `VALID: {goto with {seeded.sessions.nested}} => the path is substituted` asserting the whole
returned Step with `toStrictEqual`; `VALID: {two placeholders in one string} => both substituted`;
`INVALID: {an unbound name} => throws naming the placeholder and the available names`;
`VALID: {a string containing a literal brace and no dot} => unchanged` — the case that decides the pattern is
narrow enough not to eat a JSON body a `request` step is sending.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the two files>`

> line 2733: `    { step: 'goto',  path: '{seeded.sessions.nested}' },`
> line 2861: `    { step: 'seed',  recipe: 'session-with-nested-subagent', guild: '{g.guildId}', as: 's' },`

---

### W19 — The ref registry, in the page (wave F)

**Creates**

- `packages/siegelense/src/adapters/playwright/session/ref-registry-layer-adapter.ts` + `.proxy.ts` +
  `.test.ts` — the `addInitScript` source that installs `window.__siege.refs`, plus `resolveRef` returning an
  `ElementHandle` and `refState` answering `live` / `stale` / `unknown`.

**Depends on** W4, W11.

**Tests** unit, against a mocked Playwright page, asserting: the init-script SOURCE contains no
`querySelector(` (only `querySelectorAll`) — the package `CLAUDE.md` bans singular and this is the file where
it would be written; `resolveRef` on a live ref returns the handle; on a detached element throws
`RefStaleError` with the complete carried fields; past the array end throws `RefUnknownError` naming the
highest minted.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the three files>`

> line 2183: `- **A ref binds to an ELEMENT, not to a row number.** Recomputing a listing must not renumber what is still there.`
> line 2184: `- **Navigation, `reset` and an instance restart all invalidate every ref.** A ref used after one of those answers`

---

### W20 — The key reader, in the page (wave F)

**Creates**

- `packages/siegelense/src/adapters/playwright/session/key-read-layer-adapter.ts` + `.proxy.ts` + `.test.ts` —
  ONE `page.evaluate` producing raw rows: the DOM walk in document order, own text nodes only, the exclusion
  set, the naming ladder, every flag in `keyStatics.flags.all` with its `getComputedStyle` /
  `getBoundingClientRect` / `elementFromPoint` computation, the ref mint-or-reuse against the registry, and
  the duplicate-testId scan.

**One evaluate, not N.** Spec 548 measures the whole flag set as cheap "on a page that already had its layout
computed"; a per-element round trip would not be, and a per-element CDP call is the route spec 497 rules out
by name.

**The source string must contain `querySelectorAll` and never `querySelector`**, for the reason
`playwright-session-adapter.ts`'s own header already records.

**Depends on** W2, W4, W5, W19.

**Tests** unit, against a mocked `page.evaluate` returning fixture rows, so this file's OWN job — parse,
brand, and hand back a `KeyListing` — is what is graded; the browser-side behaviour is graded by W42's real
run. Assert: the raw rows parse to a complete `KeyListing` with `toStrictEqual`; a `within` is carried onto
the listing; the evaluate source is asserted to contain no `querySelector(` and no `textContent` read on an
element (only `childNodes` + `nodeType === 3`) — spec 565's measured reason.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the three files>`

> line 548: `**Every one of these is cheap at the scale measured** — 19 to 36 rows, one `getComputedStyle` and one`
> line 565: `- **Own text nodes, never `textContent`.** Recursive text is what pulled a whole stylesheet into a reading.`
> line 563: `- **Document order, not position order.** Sorting by y-coordinate scattered a three-item list across rows 18, 22 and 24,`

---

### W21 — The settle detector (wave F)

**Creates**

- `packages/siegelense/src/adapters/playwright/session/settle-layer-adapter.ts` + `.proxy.ts` + `.test.ts` —
  arms the `request` / `requestfinished` / `requestfailed` listeners, keeps the per-key interval history,
  applies the repeating-request discount, and exposes `waitForSettle({ ceilingMs })` returning a
  `SettleReading`.

The DOM and paint halves are counters the W19 init script installs; this adapter reads them through one
`page.evaluate` per poll.

**Depends on** W3, W6, W19.

**Tests** unit, driving the listeners directly: `VALID: {no requests, quiet DOM} => settled, elapsedMs under
the window`; `VALID: {one in-flight request that finishes} => settled once it finishes`;
`VALID: {a request to one path every 1000ms, six times} => discounted, and settles` — **this is the test that
proves the detector works on this app at all**, and it asserts `discounted` names the path;
`VALID: {DOM mutating past the ceiling} => ceiling-hit, and stillBusy names the DOM` asserting the complete
`stillBusy` array; `VALID: {a poller plus a live request} => ceiling-hit naming only the live one`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the three files>`

> line 799: `So the detector **discounts a REPEATING pattern**: a request to the same path recurring at a regular interval stops`
> line 806: `never settled — GET /api/rate-limits every 1000ms (discounted), DOM still mutating at 10s`
> line 812: `**Ceiling, not timeout.** The step still has an upper bound, because something must end. The difference is what the`

---

### W22 — Input, storage and viewport (wave F)

**Creates**

- `packages/siegelense/src/adapters/playwright/session/input-layer-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `pressKey`, `pasteText`, `pasteFile`, `resizeViewport`, `readStorage`, `clearStorage`, `reloadPage`.

`pasteText` and `pasteFile` are the measured prototype's own shapes at
`packages/web/test/siege-driver/siege-command.ts:112-135`, including the reason recorded there: a real
`ControlOrMeta+V` over a clipboard the browser owns, because a synthetic `ClipboardEvent` arrives with
`isTrusted: false` and the app's handler is free to ignore it. `playwright-session-adapter.ts:109` already
grants `clipboard-read`/`clipboard-write`, so the permission half is in place.

**Depends on** W8.

**Tests** unit against a mocked page/keyboard, asserting the arguments each real Playwright call receives —
`pressKey` calls `keyboard.press` with the exact key string; `pasteFile` writes a `ClipboardItem` whose MIME
matches the extension and THEN presses; `readStorage` returns the complete `{origin, local, session}` shape
filtered by prefix with `toStrictEqual`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the three files>`

> `packages/web/test/siege-driver/siege-command.ts:119-121`: `// A real Ctrl+V over a clipboard the browser itself owns. Constructing a synthetic` / `// ClipboardEvent instead produces isTrusted false, which the composer's own handler is free to` / `// ignore — and a measurement taken through a path production never takes is not a measurement.`

---

### W23 — The two new npm boundaries (wave F)

**Creates**

- `packages/siegelense/src/adapters/fs/cp/fs-cp-adapter.ts` + `.proxy.ts` + `.test.ts` — wraps `fs/promises`
  `cp` with `{ recursive: true, force: true }`, returns `AdapterResult`.
- `packages/siegelense/src/adapters/fetch/request/fetch-request-adapter.ts` + `.proxy.ts` + `.test.ts` —
  one method/path/body/headers round trip, returning status, duration and a truncated body. **A sibling of
  `fetch/probe`, not a change to it**: the probe returns a boolean by design and its header says why.

`@dungeonmaster/shared/adapters` exports `fs/access`, `fs/exists-sync`, `fs/mkdir`, `fs/read-file-sync` and
`fs/readdir-with-types` and no `cp` — checked, so this is a genuine gap and not a duplicate.

**Depends on** W8.

**Tests** `fs-cp-adapter.test.ts` asserts the exact options object passed to `cp`. `fetch-request-adapter.test.ts`
asserts a 201 with a body, a 500 (which still RETURNS rather than throwing — a 500 is the attacker's reading),
and a connection refusal that throws with the cause preserved through the `errorIsNativeErrorAdapter` check
this package already uses for cross-realm errors.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

---

### W24 — The session facade grows (wave G, alone)

**Edits**

- `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts` + `.stub.ts` — the facade
  gains `look`, `resolveRef`, `refState`, `settle`, `installInitScript`, `pressKey`, `pasteText`, `pasteFile`,
  `resize`, `readStorage`, `clearStorage`, `reload`, `elementBox`, `domRead`, `captureLive`, `videoOffsetMs`,
  `videoPath`.
- `packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.ts` + `.proxy.ts` +
  `.test.ts` — wires the four layer adapters in, arms `recordVideo` on `newContext`, and installs the init
  script at session creation.

**Alone**, because every verb broker in waves H and I is written against this facade and every existing
`browser-session.stub.ts` caller moves with it.

**`captureLive` is a SECOND capture method and the distinction is load-bearing.** `capture` keeps
`animations: 'disabled'` and `caret: 'hide'` because it feeds `pixelChange`; `captureLive` passes neither,
because spec 1679 says "`hold` stays LIVE while every comparison capture is frozen — freezing animation would
make every `hold` frame identical and answer 'did it settle' falsely." Two methods, not a flag, so a caller
cannot get it wrong by omission.

**Depends on** W19, W20, W21, W22.

**Tests** the adapter's existing 424-line suite extends: assert `newContext` receives the `recordVideo` option
with the evidence-tree directory; assert `captureLive` calls `page.screenshot` WITHOUT `animations`/`caret`
and `capture` calls it WITH both; assert the init script is added once, before any navigation.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the five files, plus every stub consumer>`

> line 1679: `| `hold` stays LIVE while every comparison capture is frozen                                                                  | freezing animation would make every `hold` frame identical and answer "did it settle" falsely                                                                                                                                                                |`

---

### W25 — The no-pick door, extended to refs (wave H)

**Edits**

- `packages/siegelense/src/brokers/step/target-resolve/step-target-resolve-broker.ts` + `.proxy.ts` +
  `.test.ts` — gains the `ref` arm; the AMBIGUOUS error's candidates now carry a real `ref`.
- `packages/siegelense/src/guards/is-targeting-step/is-targeting-step-guard.ts` + `.test.ts` — derives from
  `stepStatics.verbs.targeting`.

**Creates**

- `packages/siegelense/src/transformers/step-target-of-step/step-target-of-step-transformer.ts` + `.test.ts` —
  `({ step }: { step: Step }): { target: Selector | null; within: Selector | null; ref: Ref | null } | null`.

**Depends on** W14, W19, W24.

**Tests** the existing four cases stay. New: `VALID: {a live ref} => resolves and returns success`;
`ERROR: {a stale ref} => throws RefStaleError, complete fields`;
`ERROR: {an unknown ref} => throws RefUnknownError naming the highest minted`;
`INVALID: {two matches} => the candidates carry refs` asserting the complete `candidates` array with
`toStrictEqual` — this is the half chunk 2's ledger row names as NOT YET.
`step-target-of-step-transformer.test.ts` uses `it.each` over `stepStatics.verbs.targeting`, asserting each
member's extraction, and asserts `null` for each member of `verbs.all` that is not in `verbs.targeting`.
`is-targeting-step-guard.test.ts` uses `it.each` over `verbs.all` with the expected value derived by
membership in `verbs.targeting` — one statics driving both the list and the expected set.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the eight files>`

> lines 2097-2100:
> ```
> → ERROR  AMBIGUOUS: 2 elements match.
>      ref 16   PIXEL_BTN  under GUILD_LIST           "+"   (444,348) 27x25
>      ref 23   PIXEL_BTN  under GUILD_SESSION_LIST   "+"   (965,348) 27x25
>    Pick one by ref, or narrow with `within`.
> ```

---

### W26 — `look` and `box` (wave H)

**Creates**

- `packages/siegelense/src/brokers/step/look/step-look-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ session, within, depth }): Promise<KeyListing>`. Returns the key; **the SHOT is the dispatcher's job**,
  because `look` is an acting-or-not question the dispatcher already answers for every verb, and duplicating
  capture here is the second write of one picture that chunk 3 already had to fix once.
- `packages/siegelense/src/brokers/step/box/step-box-broker.ts` + `.proxy.ts` + `.test.ts`.

**Depends on** W24, W25, W13.

**Tests** `look`: `VALID: {no within} => the whole key, rendered`; `VALID: {within} => the listing carries it
and the rows are scoped`; `VALID: {a page whose rows exceed maxRows} => a truncation line naming the count`;
`EMPTY: {a page with no rows} => an empty listing that SAYS it is empty` — the `count: 0` case the whole
addressing design exists to make legible, so this test asserts the rendered text, not just `rows: []`.
`box`: `VALID: {a ref} => the complete BoxReading`; `ERROR: {a stale ref} => RefStaleError`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

> lines 2544-2548:
> ```
> → key:  24   SUBAGENT_CHAIN_HEADER
>         25     (p)  "▾ SUB-AGENT"
>         26     (p)  "Finished sub-agent (1 entries)"
>         27     subagent-chain-duration  "4m"
>   shot: shots/step4.png      ← Read this to SEE the page
> ```

---

### W27 — `dom`, the hatch (wave H)

**Creates**

- `packages/siegelense/src/brokers/step/dom/step-dom-broker.ts` + `.proxy.ts` + `.test.ts`.

All three guards live here: **own text unless `text: 'full'`** (the default is the cheap one, so the expensive
read is the opt-in and the easy mistake is the safe one), **`fields:` projects**, and **a cap that reports the
true count**. `fields: ['listeners']` is the CDP route and the only place a listener is ever read.

**Depends on** W24, W25, W9.

**Tests** `VALID: {fields: ['count']} => only count, every other field null` asserting the complete node with
`toStrictEqual`; `VALID: {no text option} => own text only`; `VALID: {text: 'full'} => textContent`;
`VALID: {412 matches, cap 10} => count 412, showing 10, capped true`;
`VALID: {fields: ['listeners']} => the CDP route is taken` — asserted by the call the adapter receives, since
this is the one route the key is forbidden to use.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the three files>`

> line 638: `| **own text by default**; `text: 'full'` opts into `textContent`      | the measured blowup was recursive text. Making the expensive one the opt-in reverses which mistake is easy to make            |`
> line 514: `- **Listener inspection is available on `dom`, never on a key row.** `fields: ['listeners']` takes the CDP route for one`

---

### W28 — `before` and `resize` (wave H)

**Creates**

- `packages/siegelense/src/brokers/step/before/step-before-broker.ts` + `.proxy.ts` + `.test.ts`.
- `packages/siegelense/src/brokers/step/resize/step-resize-broker.ts` + `.proxy.ts` + `.test.ts`.

`before`'s reading must say WHEN the script takes effect: `addInitScript` runs on the NEXT document, not the
current one. A `before` that silently did nothing to the loaded page is the kind of no-op that reads as a
working instrumentation for a whole walk.

**Depends on** W24.

**Tests** `before`: `VALID: {source} => the reading says it applies from the next navigation`, asserted with
`toBe` on the exact string; `VALID: {two before steps} => both installed, in order`.
`resize`: `VALID: {1280x1024} => the reading names the new viewport and the previous one` — the previous one
is what makes the reading a measurement rather than an echo of the input.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

> line 821: `**Solution.** A `before` step — Playwright's `addInitScript`. It is the substrate the geometry checks, the interval`

---

### W29 — `key` and `paste` (wave H)

**Creates**

- `packages/siegelense/src/brokers/step/key/step-key-broker.ts` + `.proxy.ts` + `.test.ts`.
- `packages/siegelense/src/brokers/step/paste/step-paste-broker.ts` + `.proxy.ts` + `.test.ts`.

`key`'s reading carries what is FOCUSED after the press — the prototype's own shape — because a key press with
no visible effect is otherwise indistinguishable from a key press the page never received.

**Depends on** W24, W25, W22.

**Tests** `key`: `VALID: {ControlOrMeta+V} => the reading names the pressed key and the focused element`.
`paste`: `VALID: {text} => pastedText set, pastedFile null`; `VALID: {filePath} => pastedFile set, pastedText
null`; `VALID: {a ref} => focused first, then pasted` asserting the call ORDER, because pasting before
focusing lands the payload somewhere else and still returns cleanly.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

> line 997: `page today: garbage through `type`, key spam through `key`, an oversized payload through `paste`, rapid repeated`

---

### W30 — `storage` and `file` (wave I)

**Creates**

- `packages/siegelense/src/brokers/step/storage/step-storage-broker.ts` + `.proxy.ts` + `.test.ts`.
- `packages/siegelense/src/brokers/step/file/step-file-broker.ts` + `.proxy.ts` + `.test.ts`.

`file` resolves a relative path against `lane.homePath` and an absolute one as given, for the reason the
prototype's own comment at `siege-command.ts:323-329` records: the home is "the single tree a walk both causes
and can name identically on every lane." **Only a regular file is opened** — same file, lines 359-360: a
`readFileSync` on a fifo blocks forever and takes the driver's request loop with it.

**Depends on** W24, W8, W22.

**Tests** `file`: four cases — present file, directory, non-regular, absent — each asserting the complete
`FileReading` with `toStrictEqual`; `VALID: {a relative path} => resolved against the lane home`;
`VALID: {an absolute path} => taken as given`; `VALID: {a binary file} => text null, binary true`.
`storage`: `VALID: {prefix} => only matching keys, both stores`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

---

### W31 — `request` (wave I)

**Creates**

- `packages/siegelense/src/brokers/step/request/step-request-broker.ts` + `.proxy.ts` + `.test.ts`.

A relative `path` resolves against the lane's **API** port (`lane.ports.api`), not `lane.baseUrl`, which is the
web port — `portPairContract` carries both and its own `.refine()` proves they differ. **A non-2xx status makes
the step `ok: false`**, which is what gives `expect: 'error'` its meaning here: spec 2745 — "sending a hostile
payload and getting a 400 IS the pass."

`request` is NOT in `stepStatics.verbs.browser`, so it runs against a browserless spec, which is the whole
point of spec 1013's "there the attack is `request`, `file` and the process itself."

**Depends on** W23, W8.

**Tests** `VALID: {POST 201} => ok, the complete reading`; `VALID: {POST 400} => ok false, the body carried`;
`VALID: {a relative path} => the API port, not the web port` asserting the exact URL the adapter received —
the one an implementation gets wrong silently, because the web port answers too;
`VALID: {against a browserless lane} => runs` — the negative of the browser guard, and the test that proves
`verbs.browser` was classified correctly in W1.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the three files>`

> line 2751: `{ step: 'request', method: 'POST', path: '/api/guilds', body: { name: null }, expect: 'error' }`

---

### W32 — `until` (wave I)

**Creates**

- `packages/siegelense/src/brokers/step/until/step-until-broker.ts` + `.proxy.ts` + `.test.ts`.

Five conditions, one poll loop with a ceiling, recursion rather than `while (true)`. `response` polls the
session's own network buffer via `readNetworkSince` rather than `page.waitForResponse` — the buffer is armed
at boot and already carries every exchange, so a response that landed between the previous step and this one
is still findable, where `waitForResponse` would wait for a second one that never comes.

**Depends on** W24, W10, W12.

**Tests** one per condition, each asserting the complete `UntilReading`: `visible`, `response`, `file`,
`predicate`, `console`. Plus `ERROR: {ceiling reached} => throws UntilCeilingHitError naming the condition and
the wait`; `VALID: {the response already landed before the step ran} => satisfied immediately` — the case the
buffer choice exists for, and the one `page.waitForResponse` would hang on.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the three files>`

---

### W33 — `hold` and `video` (wave I)

**Creates**

- `packages/siegelense/src/brokers/step/hold/step-hold-broker.ts` + `.proxy.ts` + `.test.ts`.
- `packages/siegelense/src/brokers/step/video/step-video-broker.ts` + `.proxy.ts` + `.test.ts`.

`hold` takes N frames through `captureLive`, diffs consecutive pairs through the existing
`pixelmatchCompareAdapter`, counts how many differ and renders one of two verdicts. **`hold` never grades
motion**, and the broker's PURPOSE says so in its own words, because this is the file where someone would add
a third verdict.

`video` writes a marker; §3 has the mechanism and the deviation.

**Depends on** W24, W6, W12.

**Tests** `hold`: `VALID: {4 identical frames} => differing 0, NOTHING CHANGED across 4.5s` asserting the
rendered string with `toBe`; `VALID: {4 frames, 3 differ} => still changing at 4.5s`;
`VALID: {frames captured} => captureLive was used, not capture` — asserted on the adapter call, because the
frozen capture would make every frame identical and answer the question falsely;
`INVALID: {frames above driverStatics.hold.maxFrames} => refused`.
`video`: `VALID: {start} => the marker carries the step and the offset`; `VALID: {stop after start} => both
offsets and the duration`; `ERROR: {stop with no start} => VideoNotRecordingError`;
`ERROR: {against a browserless lane} => VideoNotRecordingError naming the spec`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

> line 2628: `**`hold`** — N frames at an interval, reporting which differ. Detects NON-SETTLEMENT, never motion quality. Runs LIVE,`
> line 2640: `**`video`** — a screencast across a batch, for a HUMAN to watch and for the evidence trail. No step reads it back and no`

---

### W34 — `health` (wave I)

**Creates**

- `packages/siegelense/src/brokers/step/health/step-health-broker.ts` + `.proxy.ts` + `.test.ts`.

**"New" needs a baseline, and the baseline is a mark in the instance's own life.** `health` reads the console
buffer, the network buffer and the server log from the previous `health` mark forward, and the FIRST `health`
in an instance reads from boot and says so in `since`. The mark is threaded from `driverSessionState` the same
way `lastShotPath` already is — a broker may not import `state/`.

Spec 983: "**An absence with no baseline proves nothing.**" That is the whole reason this verb exists and the
reason the mark is not optional.

**Depends on** W24, W17, W6.

**Tests** `VALID: {first health in an instance} => since names boot`;
`VALID: {a second health after a clean step} => zero new errors, HEALTHY`;
`VALID: {a console error since the mark} => DEGRADED, the count, the message`;
`VALID: {a blank page} => DOWN with the colour`;
`VALID: {server-log errors only} => DOWN` — the reading nothing else surfaces;
`VALID: {an error BEFORE the mark} => not counted` — the test that proves the baseline is a baseline and not a
running total, which is the same window mistake spec 1723 records for the run index.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the three files>`

> line 983: `**An absence with no baseline proves nothing.** A screenshot of a working page after an attack is evidence only if the`

---

### W35 — Where a snapshot lives (wave J)

**Creates**

- `packages/siegelense/src/brokers/locations/instance-snapshots-path-find/locations-instance-snapshots-path-find-broker.ts`
  + `.proxy.ts` + `.test.ts` — `<os.tmpdir()>/dm-siege-<instanceId>.snapshots/<name>/`.

**Edits**

- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.ts` + `.test.ts` — removes the snapshots
  directory alongside the home. **Still never `evidencePath`**, and its existing test asserting that stays.

**A SIBLING of the home, not a child.** A `reset level: 'state'` restores the home wholesale; snapshots inside
it would be clobbered by the restore they are the source of.

**Depends on** W3, W7.

**Tests** the resolver asserts the exact path. The teardown edit asserts `fsRmAdapter` is called with both the
home and the snapshots dir and with NEITHER being `evidencePath` — assert the complete list of removal calls,
not that evidence was absent from one of them.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the five files>`

> line 1055: `So the boundary is explicit: **a snapshot covers the STATE subtree only. Logs, captures and the run transcript sit`
> line 1056: `outside it and survive every reset at every level.** Evidence accumulates forward; only state rewinds.`

---

### W36 — `snapshot`, and the diff a reset reports (wave J)

**Creates**

- `packages/siegelense/src/brokers/snapshot/create/snapshot-create-broker.ts` + `.proxy.ts` + `.test.ts` —
  copies `homePath` under the snapshot name; refuses to overwrite an existing manual name.
- `packages/siegelense/src/brokers/snapshot/list/snapshot-list-broker.ts` + `.proxy.ts` + `.test.ts` — what
  `snapshots { instance }` will call, and what `reset { to }` validates against.
- `packages/siegelense/src/brokers/snapshot/diff/snapshot-diff-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ snapshotPath, homePath }): Promise<ResetReading['undid']>`. Recursive walk, comparing existence, size and
  mtime.

**Depends on** W35, W23, W7.

**Tests** `create`: `VALID: {a name} => the copy lands`; `INVALID: {an existing manual name} => refused
naming it`; `VALID: {an automatic run_4:start name} => overwrite allowed` — the automatic pair is minted per
run and a collision there is normal.
`diff`: `VALID: {2 added, 1 modified, 1 removed} => files 4, added 2, modified 1, removed 1` — spec 2575's own
numbers, asserted complete; `VALID: {identical trees} => all zero`;
`VALID: {a file whose bytes changed but whose size did not} => counted as modified` (mtime is why the
comparison is not size-only, and it is the case a size-only diff misses).

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

---

### W37 — `reset`, and `seed` (wave J)

**Creates**

- `packages/siegelense/src/brokers/step/reset/step-reset-broker.ts` + `.proxy.ts` + `.test.ts` — `page` and
  `state`; `instance` delegates to the relaunch accessor W41 threads and, until then, throws
  `ResetLevelUnsupportedError`.
- `packages/siegelense/src/brokers/step/seed/step-seed-broker.ts` + `.proxy.ts` + `.test.ts` — resolves a
  recipe by name out of `@dungeonmaster/siegelense-recipes`, runs it against the lane, returns what it made.
- `packages/siegelense/src/brokers/recipe/resolve/recipe-resolve-broker.ts` + `.proxy.ts` + `.test.ts` — the
  catalogue lookup. **The catalogue is empty**, so today this broker's only reachable answer is
  `RecipeUnknownError` naming the empty catalogue, and its test says so in its own name.

**Depends on** W36, W12, W24.

**Tests** `reset`: `VALID: {level: 'page'} => storage cleared, page reloaded, notCleared names disk and server
memory` asserting the complete `notCleared` array; `VALID: {level: 'state', to: 'clean'} => the diff, and
notCleared names server memory and open websockets`; `INVALID: {level: 'state' with no to} => refused` —
spec 2580: "With one snapshot the target is obvious and with three it is a guess";
`ERROR: {to names a missing snapshot} => SnapshotUnknownError listing what exists`;
`VALID: {any reset} => every ref minted before it is stale afterwards` — the invalidation rule, asserted
through the registry rather than assumed.
`seed`: `ERROR: {any recipe, empty catalogue} => RecipeUnknownError naming the empty catalogue`;
`VALID: {a stubbed catalogue holding one recipe} => runs it and returns its produced ids` — a stub, because
the mechanism is what this chunk delivers and the catalogue is a later chunk's.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

> line 2580: `**`level: 'state'` takes an explicit `to`.** With one snapshot the target is obvious and with three it is a guess — and`

---

### W38 — The dispatcher (wave K, alone)

**Edits**

- `packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.ts` + `.proxy.ts` + `.test.ts` — the
  hardcoded three-verb narrowing at lines 43-45 is replaced by `stepTargetOfStepTransformer`; every new verb
  is routed.
- `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.ts` + `.proxy.ts` + `.test.ts` — after
  the verb and before the capture, a verb in `stepStatics.verbs.settling` waits for settle and the reading
  carries it; an acting step whose previous and current key are both known carries the `elements` delta.
- `packages/siegelense/src/contracts/step-reading/step-reading-contract.ts` + `.test.ts` + `.stub.ts` — gains
  `settle: SettleReading | null` and `elements: ElementDelta | null`.

**Alone**, because it is the join between everything waves H–J built and everything wave L reads.

**The `elements` delta needs a key on both sides and must not cost one.** A `look` already produces a listing;
the dispatcher keeps the LAST listing on the same threaded-accessor pattern `lastShotPath` uses, so a `look`
after a `click` reports the delta against the previous `look` for free, and an acting step with no prior
listing reports `elements: null` — never a zero delta, for the same reason `pixelChange` is `null` on a first
capture (spec 1673: "`0` would manufacture a no-change finding on the opening step of every walk").

**Depends on** W25 through W37.

**Tests** the existing dispatcher suite stays green. New, at minimum:
`VALID: {a settling verb} => the reading carries a settle reading`;
`VALID: {a non-settling verb} => settle is null`;
`VALID: {a ceiling-hit settle} => the step is still ok, and stillBusy rides the reading` — the founding rule,
and the one an implementation will get wrong by failing the step;
`VALID: {look after look} => elements carries the delta`;
`VALID: {the first look in an instance} => elements is null`;
`INVALID: {a browser verb against a browserless lane} => BrowserStepUnsupportedError` for each new browser
verb, via `it.each` over `stepStatics.verbs.browser`;
`VALID: {request against a browserless lane} => runs` via `it.each` over the complement.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

> line 1623: `| A step returns a READING, never a verdict on a unit                                                          | `siege-command.ts`'s founding rule. Comparing two measured values is still a reading; deciding a unit passes is not                                                                                                                                               |`

---

### W39 — The executor: bindings, and the automatic snapshot pair (wave L)

**Edits**

- `packages/siegelense/src/brokers/run/execute/run-execute-broker.ts` + `.proxy.ts` + `.test.ts` — accumulates
  a bindings record from each step's `as`, substitutes `{name.field}` into the NEXT step before dispatch,
  snapshots `run_N:start` before the first step and `run_N:end` after the last, and resolves a shot path for
  every verb now in `stepStatics.verbs.acting` rather than the old three.
- `packages/siegelense/src/brokers/run/execute/run-execute-step-layer-broker.ts` + `.proxy.ts` + `.test.ts` —
  `UntilCeilingHitError` joins `WaitForCeilingHitError` as a `timeout` rather than a `failed`.

**Depends on** W18, W36, W38.

**Tests** `VALID: {seed as g, then goto {g.guildSlug}} => the goto received the substituted path`, asserting
the dispatched step with `toStrictEqual` — behaviour, not wiring;
`INVALID: {a placeholder naming an unbound step} => the batch stops naming the placeholder`;
`VALID: {any run} => run_N:start and run_N:end snapshots exist` asserting the complete snapshot list;
`VALID: {a run that stopped at step 3} => run_N:end still taken` — the end snapshot is what a later cycle
returns to, and skipping it on failure loses the state the failure happened in;
`VALID: {an until that hit its ceiling} => status timeout, stoppedAt names the step and the verb`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

> line 2592: `**Every run also snapshots automatically, at start and at end**, namespaced so an explicit name can never collide:`
> line 2598: `**The manual and automatic ones answer different questions.** A manual snapshot marks a point you KNEW would matter. The`

---

### W40 — The driver threads the new accessors (wave L)

**Edits**

- `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.ts` + `.test.ts` — reads
  `healthMark`, `lastKeyListing`, `videoMarkers` and `relaunchLane` fresh per request and hands them down.
- `packages/siegelense/src/state/driver-session/driver-session-state.ts` + `.proxy.ts` + `.test.ts` — gains
  those four, each with its accessor pair, and `clear()` resets all four.

**A broker may not import `state/`.** This is the same constraint `step-dispatch-broker.ts`'s own header
records for `lastShotPath`, and the same answer: the responder owns the state and passes values, never the
module.

**Depends on** W38, W39.

**Tests** `driver-session-state.test.ts`: each new accessor starts at its documented empty value, advances,
and is cleared by `clear()` — asserting the VALUE at each point, not that a setter was called.
`driver-serve-layer-responder.test.ts`: a `run` request receives every accessor, asserted by the arguments
`runExecuteBroker` was called with.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the five files>`

---

### W41 — `reset level: 'instance'` (wave M, alone)

**Edits**

- `packages/siegelense/src/brokers/step/reset/step-reset-broker.ts` — the `instance` arm calls the threaded
  `relaunchLane`.
- `packages/siegelense/src/brokers/run/execute/run-execute-broker.ts` — the lane moves into a mutable field
  holder so the steps after the reset run against the new lane.
- `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.ts` — `relaunchLane`
  tears the current lane down and boots a new one under the SAME instance id, ports and evidence path.

**Alone, and it is the riskiest item in the chunk.** §3 has the mechanism and the fallback.

**Depends on** W37, W39, W40.

**Tests** `VALID: {level: 'instance'} => a new lane, the same evidence path, the same ports`;
`VALID: {steps after the reset} => dispatched against the NEW lane` asserting the lane object the dispatcher
received;
`VALID: {any ref minted before} => stale afterwards`;
`VALID: {the evidence path} => untouched` — assert the transcript and the shots from before the reset are
still readable, because "everything — a fresh process" is the level most likely to take evidence with it;
`ERROR: {no relaunch accessor threaded} => ResetLevelUnsupportedError naming kill and start`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the seven files>`

> line 1048: `| `instance` | everything — a fresh process, then re-seed | nothing             | ~20s boot, plus the recipe |`
> line 1069: `- **It destroys process-lifetime measurements.** The verifier prompt: a restart kills "any unit measuring a difference`

---

### W42 — The batch suite, against a real lane (wave N, alone)

**Creates**

- `packages/siegelense/test/harnesses/live-lane/live-lane.harness.ts` — boots ONE real `dungeonmaster-web`
  lane in `beforeAll` and kills it in `afterAll`, so the whole suite pays one boot.
- `packages/siegelense/src/flows/driver/run-batch.integration.test.ts` — drives real batches through the real
  driver socket against the real dungeonmaster web UI.

**This is the only place the page-side halves are graded at all.** Every unit test in waves F–J mocks
`page.evaluate`, so the key's DOM walk, the flag computations, the ref identity rule and the settle counters
are proven here or nowhere.

**Depends on** everything.

**Tests**, each asserting VALUES:

- `VALID: {look on the home page} => rows whose testIds match what the page renders`, asserting at least one
  known testId's complete row.
- `VALID: {two looks with no change between} => every ref is the same number` — spec 2183's rule, and the one
  a re-walk of the DOM breaks silently.
- `VALID: {look, click by ref} => the click landed`, asserted by the URL or the element delta.
- `VALID: {look, navigate, use the old ref} => RefStaleError` — the invalidation rule, against a real
  navigation.
- `VALID: {click on a page with a poller} => settled, and the poller is named in discounted` — the test that
  proves the discount works against this app's real rate-limit watcher, which is the case spec 795 says
  "matters here."
- `VALID: {a batch with a seed placeholder} => the unbound-recipe error names the empty catalogue` — honest,
  and it proves the substitution ran before the error.
- `VALID: {snapshot, mutate, reset to it} => the diff names what it undid`, asserting the complete `undid`.
- `VALID: {health before and after a clean click} => HEALTHY both times, zero new errors`.
- `VALID: {dom with body *} => count in the hundreds, showing the cap, capped true` — the measured blowup,
  now bounded.

**Ward** `npm run ward -- --only integration -- packages/siegelense/src/flows/driver/run-batch.integration.test.ts`

**Before this item runs**: `rm -rf /tmp/dm-siege-sockets`. `HANDOFF.md` records stale sockets breaking the
driver suite deterministically, mechanism not yet established.

---

## 5. What is deliberately NOT built yet, and why that is safe

| Not built | Safe because |
|---|---|
| The MAP | `keyListingContract` has no field for it and `look` takes no `map` argument, so adding it later adds a field rather than changing one. The key carries the load today, which is what the one trial arm that had both reported |
| Recipe CONTENT | `seed`'s mechanism, its binding and its substitution are all real and tested; only the catalogue is empty, and `RecipeUnknownError` names the empty catalogue rather than pretending |
| `snapshots` as a CALL | `snapshotListBroker` exists and is tested; registering a thirteenth call belongs with the six unregistered ones, not with a step |
| Server-side failure injection | Part 7 item 12. The attacker gets `request`, `file`, `key`, `paste`, `resize` and `hold` here, which is most of `hostile-input` |
| Video RETENTION | Spec 1713: "Video ages out FIRST and separately." Ageing is Part 7 item 2c and is still blocked on the citation resolver (item 11g's consuming half). This chunk writes the file and records its path; nothing deletes it |
| A lint rule for the no-pick rule over the NEW verbs | It already exists and already covers them. `@dungeonmaster-local/ban-locator-pick` is scoped to `packages/siegelense/src/brokers/step/**` by `isLocatorPickScopeFileGuard`, and every verb broker here lands inside it. **Widening the rule would make it broader than its message claims**, which `siegelense-recipes.md` names as its own hazard |

---

## 6. What a person can DO once this lands

Through the driver, in one batch, against the real dungeonmaster web UI:

```jsonc
run { instance, stopOn: 'error', steps: [
  { step: 'before',   source: 'window.__ticks=0;const o=setInterval;setInterval=(...a)=>{window.__ticks++;return o(...a)}' },
  { step: 'snapshot', as: 'clean' },
  { step: 'health' },
  { step: 'goto',     path: '/' },
  { step: 'look' },                                  // the key, with refs
  { step: 'click',    ref: 23 },                     // driven by ref
  { step: 'look' },                                  // elements: +7 under GUILD_ADD_MODAL
  { step: 'type',     ref: 41, value: 'guild-alpha' },
  { step: 'until',    response: { method: 'POST', path: '/api/guilds' }, timeoutMs: 15000 },
  { step: 'hold',     frames: 4, everyMs: 1500 },    // did the spinner settle?
  { step: 'health' },                                // did it hold?
  { step: 'reset',    level: 'state', to: 'clean' }, // and what did that undo?
]}
```

Every acting step in that batch comes back with `shot`, `pixelChange`, `blank`, `elements` and `settle` — and
none of it had to be asked for.

**What a person CANNOT do yet**: seed anything (the catalogue is empty), open a map (deferred), prune a video
(retention is a later chunk), or call `snapshots` (an unregistered call).

---

## 7. Risks this plan takes on purpose

| Risk | Why it is taken | What would show it going wrong |
|---|---|---|
| The key's whole DOM walk is graded by ONE integration test | Every unit above it mocks `page.evaluate`, and the alternative is a jsdom key builder that proves the renderer against a DOM the browser does not have | W42 fails, or worse, passes while a flag is silently never computed. Mitigation: W42 asserts a COMPLETE row for a known testId, so a missing flag is a diff, not an absence |
| `reset level: 'instance'` threads a relaunch accessor four layers | It is the established pattern here (`lastShotPath`) and the only one a broker's import rules allow | The typecheck. If it does not land cleanly, §3's fallback is a named refusal, not a silent partial |
| Video records always, per browser lane | Playwright has no mid-context start, and the alternatives destroy page state or hand back frames with no encoder | Disk growth per instance. `driverStatics` carries the knob; the cost is stated rather than discovered |
| The settle detector's discount is tuned by three numbers nobody has measured on this app | Spec 799 states the mechanism and not the constants. `settleStatics` holds all three in one place with the reasoning, so tuning is one file | Steps that hang on a poller (discount too strict) or return early mid-render (too loose). W42's poller test is the guard |
| The step union goes from six members to twenty-two in one item | Splitting a discriminated union across agents is a merge conflict by construction | W14's wave is a bottleneck. It runs alone for exactly that reason |
| `elements` compares two `look` listings, so a batch with one `look` reports `null` | A delta needs both sides, and manufacturing a zero is the `pixelChange: 0` failure one field over | A session reading `null` as "no change". The field's own contract PURPOSE says `null` means "no prior listing", never "nothing changed" |

---

## 8. Ledger rows this chunk expects to move

The ledger's owner moves these; this plan does not edit `build-ledger.md`.

**The `Line` column below is the LEDGER's own column, not the spec's current line numbers.** Every other line
number in this file is the spec's, read off `siegelense-tooling.md` in this worktree. The two disagree by
roughly thirty lines because the status markers this round's ledger pass added shifted everything below them,
and the ledger's own header says to re-derive from heading text rather than from an older copy of its table.

| Row | Line | From | To |
|---|---|---|---|
| Addressing: a listing, not a selector | 332 | NOT STARTED | DELIVERED chunk 5 |
| The `attrs` column | 434 | NOT STARTED | DELIVERED chunk 5 |
| "Does this element have a click handler?" | 475 | NOT STARTED | DELIVERED chunk 5 (the negative half, which is all there is) |
| Two key-level readings | 505 | NOT STARTED | DELIVERED chunk 5 |
| What is deliberately NOT computed | 522 | NOT STARTED | DELIVERED chunk 5 — nine things absent, each asserted |
| `dom` is the ESCAPE HATCH | 589 | NOT STARTED | DELIVERED chunk 5 |
| Perception: three artifacts | 649 | PARTIAL chunk 3 | PARTIAL chunk 5 — still NOT the map, by design |
| `pixelChange` | 696 | PARTIAL chunk 3 | DELIVERED chunk 5 — the element-delta pairing lands |
| Settling | 768 | NOT STARTED | DELIVERED chunk 5 |
| Instrumentation | 803 | NOT STARTED | DELIVERED chunk 5 |
| Computed findings | 811 | NOT STARTED | DELIVERED chunk 5 |
| Time: what is decidable | 826 | NOT STARTED | DELIVERED chunk 5 |
| Survival | 961 | NOT STARTED | DELIVERED chunk 5 |
| Resetting: three layers | 1004 | NOT STARTED | DELIVERED chunk 5 |
| 4A · Addressing: the key, refs, the map | 1612 | NOT STARTED | PARTIAL chunk 5 — every row but the map's two |
| Refs are for DRIVING | 2114 | NOT STARTED | DELIVERED chunk 5 |
| The rule that governs every targeting step | 2051 | PARTIAL chunk 2 | DELIVERED chunk 5 — refs land |
| Steps that exist today and are kept | 2467 | PARTIAL chunk 2 | DELIVERED chunk 5 — all thirteen |
| Steps that are new | 2501 | NOT STARTED | DELIVERED chunk 5 |
| What every acting step returns | 2670 | PARTIAL chunk 3 | DELIVERED chunk 5 — `elements` lands |
| A worked batch | 2687 | PARTIAL chunk 2 | DELIVERED chunk 5 — `as` and `{name.field}` land |
| Interleaving recipes and steps | 2812 | NOT STARTED | PARTIAL chunk 5 — the mechanism, not the catalogue |
| Cycles | 2861 | PARTIAL chunk 3 | DELIVERED chunk 5 — both cycle shapes, and a real settle-based timeout |
| Part 7 item 5 (`before`) | 2010 | NOT STARTED | DELIVERED chunk 5 |
| Part 7 item 7 (the key as a tree) | 2012 | NOT STARTED | DELIVERED chunk 5 |
| Part 7 item 8 (`health`) | 2013 | NOT STARTED | DELIVERED chunk 5 |
| Part 7 item 9 (`until`) | 2014 | NOT STARTED | DELIVERED chunk 5 |
| Part 7 item 10 (selectable readings) | 2015 | PARTIAL chunk 3 | DELIVERED chunk 5 — the `dom` half |
| Part 7 item 11 (`hold` + `video`) | 2016 | NOT STARTED | DELIVERED chunk 5 |
| Part 7 item 14 (three reset levels) | 2026 | NOT STARTED | DELIVERED chunk 5 |
| Part 7 item 15 (`resize`, `request`) | 2027 | NOT STARTED | DELIVERED chunk 5 |
| Part 7 item 13b (`compare`) | 2025 | PARTIAL chunk 3 | DELIVERED chunk 5 — `elements` joins the compare answer |
