# Step verb — `look`

The seventh step verb, and the one that closes the addressing dead end. `look` returns the KEY: a tree of every
addressable element on the page, each row carrying an element-bound `ref`, four columns, the flag set, the
duplicate-testId line and the truncation line; it writes the shot beside the reading. Rung 2 — `look { within }`
— is the same reading scoped to one region.

Line numbers cite `scrolls/seigelense/siegelense-tooling.md` unless another file is named.

---

## 1. The requirements table

One row per distinct thing the spec says `look` must do or return. Graded at the end of the build.

| # | Requirement | Spec |
|---|---|---|
| R1 | `look` returns the KEY — a tree of every addressable element, nested by testId ancestry | 358, 2587 |
| R2 | Every row carries a `ref`: the ephemeral handle, valid in this instance and page state only | 388 |
| R3 | Indentation IS scope — the selector reads off the nesting | 389, 562 |
| R4 | The element column carries the `data-testid`, **the tag even when a testId exists**, the `role`, a DOM `id`, and `[n/m]` where siblings share a name | 390, 395, 537 |
| R5 | The text/value column: own text; for an input the CURRENT value and the placeholder SEPARATELY | 391 |
| R6 | The attrs column: `href` as `→ /path` with `↗` for `target="_blank"`, `data-*`, `maxlength`/`pattern`/`required`, `type`, `title` | 392, 405-413, 461-467 |
| R7 | The attrs column has a BUDGET: values truncate, the row caps, and a capped row says how many it dropped | 469-472 |
| R8 | The attrs column has a DETERMINISM GUARD: a value that looks like a runtime id is dropped | 474-478 |
| R9 | `className` is in NEITHER the attrs column NOR the flag set | 480-491 |
| R10 | The flags column carries the condition set the spec's table names | 417-437 |
| R11 | attrs and flags split on DECLARED versus CONDITION | 399-408 |
| R12 | `not-tabbable` is a labelled PROXY — `cursor: pointer`, non-focusable tag, no `tabindex` | 495-521 |
| R13 | No per-row event listeners, and nothing infers a dead control from one | 545, 521 |
| R14 | A testId appearing under two DIFFERENT parents is reported as a line under the key | 524-533 |
| R15 | `role` sits beside the tag in the element column, not in attrs | 537 |
| R16 | NOT computed: sibling rect-intersection, z-index/stacking analysis, anything about motion | 542-547 |
| R17 | Truncation is reported, never silent — `… 12 more under CHAT_MESSAGES_AREA` | 558-560 |
| R18 | Document order, not position order | 567 |
| R19 | **Own text nodes, never `textContent`** | 570, 616 |
| R20 | An untagged element prints as its tag — `(p)` — and a row's parent is its nearest testId ancestor | 572 |
| R21 | Excluded outright: `style` `script` `meta` `link` `title` `head` `noscript`; any zero-size box; `display: none`; `visibility: hidden` | 573 |
| R22 | `opacity: 0` is FLAGGED, not excluded | 575 |
| R23 | The naming ladder: own text → attributes → scope → nth | 578-585 |
| R24 | A ref binds to an ELEMENT, not a row number. Recomputing must not renumber what is still there | 600, 2210 |
| R25 | `look { within }` — the same reading scoped to one region. Rung 2 | 604, 623, 2593 |
| R26 | `look` is rung 1, the default, ~243 tokens for a whole page | 622 |
| R27 | `look` returns the KEY inline and WRITES THE SHOT, returning its path | 2587, 2598 |
| R28 | The MAP is optional and ships later — the field is ABSENT, never empty | 2588-2589 |
| R29 | Every targeting step: one match proceeds; >1 throws AMBIGUOUS carrying the candidates **with their refs**; 0 throws NO MATCH | 2115-2139 |
| R30 | A ref can never be ambiguous. It answers `stale` when the element detached | 2141 |
| R31 | A ref is scoped to ONE INSTANCE and inside it to one page state; four boundaries it cannot cross | 2179-2194 |
| R32 | Navigation, `reset` and an instance restart invalidate every ref. A used ref answers `stale` — never a different element | 2211 |
| R33 | Refs are for DRIVING, selectors for RECORDING. A recorded artifact never carries a ref | 2168-2202 |
| R34 | `querySelectorAll` only in eval source, never `querySelector` | 2163, `packages/siegelense/CLAUDE.md` |
| R35 | Never `.first()` / `.last()` in a command | 2153, `packages/siegelense/CLAUDE.md` |
| R36 | `look` is a browser step — it errors BY NAME against a browserless spec | 2128-2130 |
| R37 | A `look`'s own reading is reached by `results --step N` with no `--kind`, and that reading IS the key | 2718-2720 |
| R38 | `StepAmbiguousError`'s structured `candidates` array is populated (findings-log row 10, `HANDOFF.md:286`) | — |

---

## 2. The key's row shape

`keyRowContract`:

| Field | Type | Holds | Spec |
|---|---|---|---|
| `ref` | `Ref` | the element-bound handle | 388 |
| `depth` | `ArrayIndex` | nesting; the renderer turns it into indentation | 389 |
| `testId` | `ContentText \| null` | the `data-testid` | 390 |
| `tag` | `ContentText` | the tag, **present even when `testId` is** | 395 |
| `role` | `ContentText \| null` | beside the tag, because it is part of what the element IS | 537 |
| `domId` | `ContentText \| null` | a DOM `id` where one is set | 390 |
| `sibling` | `ContentText \| null` | `1/2` where siblings share a name | 390 |
| `text` | `ContentText \| null` | OWN text nodes only | 570 |
| `value` | `ContentText \| null` | an input's CURRENT value | 391 |
| `placeholder` | `ContentText \| null` | separately, because they are different questions | 391 |
| `attrs` | `readonly AttrPair[]` | what the element DECLARES, already budgeted and guarded | 392 |
| `attrsDropped` | `ReadingCount` | what the budget dropped | 469 |
| `flags` | `readonly ElementFlag[]` | the CONDITIONS it is in | 393 |
| `flagDetail` | `Record<string, ContentText>` | the measurement behind a flag that carries one — `low-contrast 1.4` | 433 |

`keyListingContract`: `{ within, rows, duplicates, truncated, rendered }`. **No `map` key at all** (R28) — an
absent field is honest where an empty one invites a session to wonder what went wrong.

### Which elements become rows

An element is a row when it is not excluded (R21) AND it is addressable: it has a `data-testid`, OR it has own
text, OR it is an interactive control, OR it is an `<img>`. A bare wrapper `<div>` is none of those, which is
the mechanism behind "intermediate wrapper divs collapse out on their own" (R20). `depth` is the number of
ancestors that are themselves rows, so the key nests exactly the way the spec's worked example at 368-373 does.

---

## 3. Refs: minting, and the four boundaries

**The registry lives in the PAGE, which is what makes the boundaries physical.** `window.__siege.refs` is an
array of Elements installed by an `addInitScript` at session creation; a ref is `index + 1`.

- **Mint-or-reuse (R24).** A `look` does an identity lookup in the array per element: a hit REUSES that number,
  a miss pushes and mints. Recomputing never renumbers what is still there.
- **Detached → `stale` (R30).** `refs[n]` still holds the element; `element.isConnected` is `false`.
- **Navigation → `stale` (R32).** `addInitScript` re-runs on every document, so the array comes back EMPTY.

That last one needs a Node-side half, and this is the one thing the chunk-05 plan gets wrong: with a page-only
registry, a ref used after a navigation is "past the array's end", which is indistinguishable from a ref
carried in from another instance. So the adapter closure keeps `highestMinted`, which survives navigation and
dies with the instance:

| Condition | Answer | Boundary |
|---|---|---|
| `ref > highestMinted` (Node) | `RefUnknownError` | a ref from another instance |
| `ref <= highestMinted`, past the page array's end | `RefStaleError`, boundary `navigation` | navigation / `reset` / restart |
| in the array, `isConnected === false` | `RefStaleError`, boundary `detached` | the element left the DOM |
| in the array, connected | resolves | — |

**Never a different element**, in any of the four. `RefUnknownError` names the four boundaries; `RefStaleError`
names which one it crossed where the driver can tell, and both end with the recovery: run `look` again.

---

## 4. What lands, and what does not

**Built: `look` completely, plus ref DRIVING.** A key full of refs nothing can act on closes nothing — the
dead end in `HANDOFF.md:206-214` is a CLICK that cannot be aimed. So `click` and `type` gain `ref`, and
`stepTargetResolveBroker` gains the ref arm that makes a ref a first-class handle beside a selector.

**Built: rung 2, `look { within }`.** It is the same reading scoped, so it costs a parameter and a filter.

**Built: the `StepAmbiguousError` fix (R38).** It is findings-log row 10, it is open, and it is inside a file
this work modifies anyway. The whole point of `look` is that a session can now ACT on the answer; an ambiguity
error whose JSON carries nothing is the same failure one layer down. The same edit closes findings-log row 11:
a candidate now carries a real `ref`, so the advice the error gives can be followed even when both candidates
share a `within`.

**Not built, and each is a row of the ladder or a later chunk:**

| Not built | Why |
|---|---|
| `box { ref }` — rung 3 | its own verb; `look` closes the dead end without it |
| `dom { target }` — rung 4, the hatch | its own verb with three guards of its own |
| the numbered MAP | 2588: ships later, and the field is absent until it does |
| the `elements` delta on an acting step | 2764: needs a key on both sides and a threaded last-listing accessor — a dispatcher change belonging with the other new verbs |
| `waitFor { ref }` | `ElementHandle.waitForElementState` has no `attached`/`detached`, which `locatorStateContract` carries. A ref you already looked at is a poor `waitFor` subject |
| the settle detector | a different spec section (781) and not addressing |

---

## 5. Build list, file by file

| # | File | Folder type | New/Edit |
|---|---|---|---|
| 1 | `statics/key/key-statics.ts` + `.test.ts` | statics | NEW |
| 2 | `statics/step/step-statics.ts` + `.test.ts` | statics | EDIT — `verbs.all`/`browser` gain `look`; new `verbs.capturing` |
| 3 | `contracts/ref/` (3 files) | contracts | NEW |
| 4 | `contracts/element-flag/` (3) | contracts | NEW |
| 5 | `contracts/attr-pair/` (3) | contracts | NEW |
| 6 | `contracts/key-row/` (3) | contracts | NEW |
| 7 | `contracts/key-listing/` (3) | contracts | NEW |
| 8 | `contracts/step/` (3) | contracts | EDIT — the `look` member; `ref` on `click`/`type` |
| 9 | `contracts/step-candidate/` (3) | contracts | EDIT — `ref` |
| 10 | `contracts/browser-session/` (3) | contracts | EDIT — `look`, `refState`, `clickRef`, `fillRef` |
| 11 | `errors/ref-stale/` (2) | errors | NEW |
| 12 | `errors/ref-unknown/` (2) | errors | NEW |
| 13 | `errors/step-ambiguous/` (2) | errors | EDIT — store `candidates`, print `ref N` |
| 14 | `transformers/attrs-budget/` (2) | transformers | NEW |
| 15 | `transformers/key-render/` (2) | transformers | NEW |
| 16 | `transformers/within-selector-normalise/` (2) | transformers | NEW |
| 17 | `adapters/playwright/session/ref-registry-layer-adapter.*` (3) | adapters | NEW |
| 18 | `adapters/playwright/session/key-read-layer-adapter.*` (3) | adapters | NEW |
| 19 | `adapters/playwright/session/playwright-session-adapter.*` | adapters | EDIT + a real-browser integration test |
| 20 | `brokers/step/look/` (3) | brokers | NEW |
| 21 | `brokers/step/target-resolve/` (3) | brokers | EDIT — the ref arm |
| 22 | `brokers/step/click/` (3) | brokers | EDIT — ref |
| 23 | `brokers/step/type/` (3) | brokers | EDIT — ref |
| 24 | `brokers/step/dispatch/run-verb-layer-broker.*` | brokers | EDIT — route `look`, pass `ref` |
| 25 | `brokers/run/execute/run-execute-broker.ts` | brokers | EDIT — shot path off `verbs.capturing` |
| 26 | `brokers/run/execute/run-execute-step-layer-broker.*` | brokers | EDIT — R38 |
| 27 | `statics/docs/docs-statics.ts` + `.test.ts` | statics | EDIT — the `walking` scope no longer says the reading step is unbuilt |

### The registration cascade

`stepStatics.verbs.all` feeds `stepVerbContract`, which feeds the `step-contract.ts` union, the dispatch
broker, the verb layer broker, `isBrowserStepGuard` and every test asserting the six-verb list with
`toStrictEqual`. `call-snapshots.md:247-255` maps it; every row transfers. Two rows that map names that one
does not:

- `docs-statics.test.ts` and `docs-answer-compose-transformer.test.ts` assert that NO member of
  `verbs.all` appears anywhere in the `operating` scope's text. Checked: the `operating` scope holds no
  occurrence of "look", so adding the verb does not break them.
- The `walking` scope DOES describe `look` as not built, four times. Leaving it is findings-log row 13
  repeating itself — a manual told an operator a built call was unbuilt.

---

## 6. The test list

Unit, per file, with the `registerMock` proxy pattern. Four assertions carry the job, and each is a way this
verb could pass a test while being useless — all four are INTEGRATION, against a real Chromium over a real
local HTTP server, because the reading is page-side JS and a mocked `page.evaluate` grades only the parse:

1. **The dead end is closed.** Two elements sharing `data-testid="PIXEL_BTN"` AND the same `within`
   (`MAP_FRAME`) — the exact shape of `HANDOFF.md:206-214`. Assert `look` gives them distinct refs, and that
   `clickRef` on the second one hits the SECOND one.
2. **Own text nodes only.** A `<style>` block and a long nested subtree under an ancestor. Assert the row's
   text is the element's own and carries none of the descendant content.
3. **A ref does not survive a navigation.** Assert `RefStaleError`, naming the boundary — never a silent
   resolve to something else.
4. **The tree is a TREE.** Assert the `depth` values are real structure, and that a bare wrapper `<div>`
   produced no row at all.

Unit tests worth naming:

- `key-render-transformer.test.ts` — the whole rendered block asserted with `toBe`, line for line, against
  the spec's own worked key; the `→ /queue` and `→ /docs ↗` forms; `(p)` for an untagged element; the
  duplicate line; the truncation line; value and placeholder as separate columns.
- `attrs-budget-transformer.test.ts` — `className` absent; a uuid-shaped `data-*` value DROPPED, asserted on
  the COMPLETE `kept` array rather than on a count; a capped row reporting `dropped`.
- `step-ambiguous-error.test.ts` — the carried `candidates` asserted complete, and `ref N` in the message.
- `ref-stale-error.test.ts` / `ref-unknown-error.test.ts` — the complete rendered message, anchored.
- `step-target-resolve-broker.test.ts` — the ref arm: live resolves, stale throws, unknown throws.
- `step-look-broker.test.ts` — the listing comes back rendered; `within` is carried onto it.
- `step-statics.test.ts` — `verbs.all` complete with `toStrictEqual`; every subset derived FROM `verbs.all`.

---

## 6b. The grade, after the build and the drive

Every row of §1, graded against the code and against a real drive of `dungeonmaster siegelense` on
`dungeonmaster-web`.

| # | State | Note |
|---|---|---|
| R1–R5 | **built** | Driven: 21 rows on the home screen, 26 after a create, nested and indented. |
| R6 | **built** | Driven: `→ / data-discover=true`, `→ /queue`, `data-size=xs`, `type=button`. |
| R7 | **built** | Cap 4 per row, values truncate at 40, `+N more` on overflow. |
| R8 | **built** | Two guards: attr values, and — found by DRIVING — DOM ids. Mantine mints `mantine-gwrqe5vg6-label` per mount and the key was carrying it. |
| R9 | **built** | `className` in neither list, and a negative test in `key-statics.test.ts` fails if it is re-added. |
| R10–R12 | **built** | The full flag vocabulary. `not-tabbable` is a labelled proxy and, after driving, an ANCESTOR question — the per-element form fired on 4 of 21 rows, all inside one link. |
| R13, R16 | **built** | Nothing computes a listener, an overlap, a stacking context or anything about motion. |
| R14 | **built** | Driven: `… PIXEL_BTN appears 2× — under GUILD_LIST and under GUILD_SESSION_LIST`, printed unasked. |
| R15, R17–R22 | **built** | `role` inside the brackets; document order; own text via `nodeValue`; `(p)`/`(span)`; the seven excluded tags; `opacity: 0` flagged rather than excluded. |
| R23 | **built** | Own text → `aria-label`/`title`/`alt`/`name` → the tree → `[n/m]`. `placeholder` and `value` are served by their own columns instead, which is what §1's R5 asks for. |
| R24 | **built** | Driven: after a create, refs 1–13 and 21 kept their numbers and the new rows took 22–33. The ref column is deliberately non-monotonic, which is the visible proof. |
| R25–R27 | **built** | Driven: `look { within: 'SUBAGENT_CHAIN' }` shorthand and the explicit selector both work; `look` sits in `verbs.capturing`, so the dispatcher writes its shot and measures `blank`/`pixelChange`. |
| R28 | **built** | `keyListingContract` is `.strict()` with no `map` key, and a test asserts `{ map: … }` is rejected by name. |
| R29–R32 | **built** | Driven: an ambiguous click lists both candidates with refs 19 and 20; a ref used after a navigation answers `STALE REF … boundary crossed: navigation`. |
| R33 | **built, with one thing to know** | The RULE is held by the contract (a step takes a target or a ref, never both) and by the docs. The one place a ref reaches disk is `StoppedAt.candidates` inside that instance's own `run_N.json` — the instance's transcript, which `results` reads back from the same instance. It is none of the nine artifacts the spec names. |
| R34, R35 | **built** | A unit test asserts the reader's source carries no `querySelector(` and no `textContent`; no `.first()`/`.last()` was added anywhere. |
| R36 | **built** | `look` is in `verbs.browser`, so a browserless spec refuses it by name. |
| R37 | **built** | Driven: `results --run run_1 --step 2` with no `--kind` returns the key as it stood. |
| R38 | **built** | Driven: the structured `candidates` array now carries both rows with their refs. Findings-log row 10 closed; row 11 closed with it. |

Not built, each named in §4: `box { ref }`, `dom { target }`, the numbered map, the `elements` delta,
`waitFor { ref }`, the settle detector.

---

## 7. Ward

```
npm run ward -- --only lint,typecheck,unit,integration -- <every touched file>
```

Repo-relative paths, no `./`, `timeout: 600000`, iterate to exit 0. Then build the package and DRIVE the real
binary against a real lane, per `scrolls/seigelense/manual-verification-runbook.md`.
