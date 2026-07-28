# Assayer — Open defects

> Every defect here is CURRENTLY REAL and was read off a real run, never reasoned about.
> Each entry states the symptom, a repro you can paste, the root cause with file paths
> where it is known, and what closing it involves. Delete an entry when it closes — never
> annotate it as resolved.
>
> **Scope:** every open defect. Capability Assayer does not have YET lives in
> `plan/followups.md` — those shapes refuse honestly, with an accurate invoice, so they are
> gaps and not defects. One moves here the moment it starts LYING: deriving a case that
> fails against correct code, reporting coverage that did not happen, or printing a reason
> that is not the reason. Anything in neither file is not known.
>
> **Verify any fix with ALL THREE** `npm run ward`, `npm run test:syntax`, and
> `npm run typecheck:syntax` — the specimen catalogue is not in ward's jest graph, and
> `typecheck:syntax` covers a graph neither of the other two does.
>
> **Probe before asserting.** Import by absolute path under `npx tsx`; run the built CLI
> at `packages/cli/dist/bin/assayer.js` for anything end-to-end.

## C. Harness remainders

### C1. A harness cannot pay a refusal owned by a funnelled CALLBACK, or one folded across a file boundary

Closed for the NAMED-PRIVATE shape: a refusal a driving route hits on a same-file private's
behalf (`funnel-named-cases`, a branchless surface returning a private call; `through-caller-cases`,
a private reached through a resolvable named call) is invoiced against the HOST and the
invoice reads ``on `build` ``. `FileAnalysis.declaringScopes` now carries every such private
(its own name, full param list, and the host that reaches it), and `harness-validate` treats it
as a candidate exactly like a top-level entry — the key the invoice prints validates.
`harness-realize-broker` takes an OPTIONAL `walked` (the raw parse its callers already hold) and,
when given it, re-runs `follow-calls-transformer` itself with the harness spec threaded per
declaring-scope name — never a second derivation path, the SAME transformer the compile walk
used — so the supplied value rebases onto the CALLER's own argument slot (`funnel-named-cases`'s
existing generic rebase, `{ ...binding, param: param.name }`) with the key path unchanged, never
spliced onto the host's argument list as a slot the signature has no room for. Without `walked`
the entry is left untouched, rather than risk the wrong binding shape a flat per-entry
re-derivation over the private's own params alone would produce. `run-unit-broker`,
`compiled-file-resolve-broker`, and the `syntax-traits` harness — the CLI's, the desktop's, and
the catalogue's own real run paths, the same three seams every consume-time overlay is wired
at — all thread `walked` here, so a harness naming a funnelled or through-caller private pays
that refusal in `assayer unit` and the desktop app, not only in the catalogue's cross-check.

Still open for a funnelled CALLBACK — `funnel-cases` (an inline `items.map((n) => …)` folded into
a branchless host) and `through-callback-cases`'s own callback element — and for
`compose-cross-file-map` (the cross-file callback twin). Widening `declaringScopes` to admit these
the same way would make `harness-validate` accept a key `harness-realize` can never bind: the
callback's refused parameter is the ARRAY ELEMENT itself, so paying it means embedding a
harness-resolved value inside the array `causeArrangeTransformer` builds for the host's array
param — and `ArrangeValue` (`packages/shared/src/contracts/arrange-value/arrange-value-contract.ts`)
has no variant for a value that is a harness key path rather than a representable literal. Until
that capability exists, admitting these scopes into `declaringScopes` would open the exact
validate/realize disagreement this entry exists to close, just walked in the other direction.
`compose-cross-file-map` carries a second, independent blocker even if that capability lands: the
declaring scope is a symbol in a SIBLING file's own `FileAnalysis`, not this file's, so closing it
also needs the sibling's own colocated harness composed in — a strictly larger change than
threading one fact through one file's pipeline.

## D. Catalogue coverage — features the specimen matrix cannot see regress

The catalogue is the ratchet: a feature with no specimen can be lost without a single test
turning red. Each of these is pinned only by core unit tests today.

**A P1 can never be specimen'd, and that is structural.** A harness P1 fails the whole compile,
so one bad `*.harness.ts` in the catalogue blocks `assayer unit` for every OTHER specimen beside
it — verified against the real CLI, where an unrelated file's P1 stopped `assayer unit
src/other.ts`. That cascades into `compileSmokeCache()` and every app and desktop e2e that
depends on a clean compile. It is also the correct behaviour: a P1 is a build error, the same
class as a broken import, and a build error that let the build continue would not be one.

The consequence is that the bucket rule cannot reach it. `sad-path/` is defined by the four
ADMISSIONS — dark spot, gap, undriven, lint — and a P1 is none of them; it is the channel that
stops the run rather than reporting on it. So any P1 is pinned against real files by an
integration test instead (`compile-harness-graph-broker.integration.test.ts` compiles real
fixtures through the real pipeline in an isolated temp dir). Reach for that precedent rather
than trying to make the catalogue hold one.

### D3. No funnelled/driven-route input gap specimen

`sad-path/input-gap/` covers entry-own refusals only. Nothing exercises a refused parameter
belonging to a folded private or a callback, so that channel — added so those builders stop
dropping refusals on the floor — cannot be seen to regress. Pairs with C1.

The private half is now specimen-able (C1 closed the mechanism a specimen would pin): a
`sad-path/input-gap/funnelled-param` byte-identical twin of `happy-path/harness/funnelled-param`
— a branchless surface returning a same-file private by an inline-callback argument, the
private's own callback param refused — the first pinning the `on \`helper\`` invoice text
through the real catalogue, the second a colocated `.harness.ts` naming the private and
asserting real cases derive. The callback half still cannot be specimen'd honestly: no harness
closes it yet (see C1's still-open half), so a specimen would only pin the refusal staying open.

### D5. No specimen carries a GAP and an UNDRIVEN branch on one entry

`analyze-file-broker` drops an entry's undriven admissions when that entry also carries an
input gap — precedence, never a merge, and one of the few places two admissions meet. No
specimen declares both on one entry (probed: no `'undriven'` and `'gap:input'` co-occurrence
in `specimen-registry.ts`), so the rule is pinned only by a hand-built core unit case and
cannot be seen to regress through real parsing.

### D7. No specimen exercises a branchless-predicate array callback (`.filter`/`.some`/`.every`/`.find`)

Every array specimen in the catalogue (`happy-path/array/**`) maps a callback that either
transforms its element (`map`) or branches on it with an `if` (`map-conditional`,
`string-element`, `two-maps`). None gives the callback a bare `return n > 5` body — the shape
that publishes `predicateSignature` (`scope-record-contract.ts`) instead of a `BranchNode`, and
is exactly what `.filter`/`.some`/`.every`/`.find` look like in practice. So the return-predicate
axis `through-callback-cases-transformer` and (through it) `funnel-cases-transformer` derive over
a callback's element — the split into a satisfying and a violating case, rather than one
representative fill — is pinned only by
`through-callback-cases-transformer.test.ts` / `funnel-cases-transformer.test.ts`, never by a
real parse. Probed: no `predicateSignature` in any `happy-path/array/**/*.ts` source file, and
`discover({ grep: '\\.filter\\(|\\.some\\(|\\.every\\(|\\.find\\(' })` over the catalogue matches
nothing outside `packages/core` itself.

Closing this needs a new `happy-path/array/<name>/<name>.ts` — a branchless `items.filter((n) =>
n > 5)` funnelled into its host exactly as `map-conditional` is, plus its `specimen-registry.ts`
line — added the way §6 of `packages/core/CLAUDE.md` prescribes, coordinated with whoever else is
touching `smoke-repo/**` at the time, since the directory and the registry are both shared.

### D6. `access:unreachable` can never reach a specimen

`access:through-caller` now has one — `happy-path/composition/through-caller` — a private a
caller reaches but does not RETURN (so it cannot fold into a funnel), promoted to its own
entry with `callerName` naming the caller. `uncataloguedTraits` shrinks to one key.

`access:unreachable` cannot follow it, and not for lack of a specimen: it is structurally
excluded from ever landing on an entry. `readEntryAccessLayerAdapter` assigns it only when the
module's export table has no entry for the scope (`read-entry-access-layer-adapter.ts:71`),
which is exactly the condition under which `analysisProjectionTransformer`'s own filter
(`scope.kind === 'function' && scope.exported`) already excludes that scope from
`FileAnalysis.functions`. The only route back in is `followCallsTransformer`, which either
FUNNELS the scope (folded into its caller, no entry of its own), promotes it to
`access:through-caller`, or leaves it on `undriven` — which carries no access kind at all. So
no specimen, however written, can put `access:unreachable` on an entry: the value is real only
inside the raw walk, one step before `FileAnalysis` is built, and is pinned there — and only
there — by `read-entry-access-layer-adapter.test.ts`. Closing this would mean changing what the
field can hold, not writing a source file; `uncataloguedTraits` documents that in place of one.

## E. Gate and test coverage

### E5. A scratch repo for a CLI run must be nested INSIDE this tree

`ts-jest` resolves `node_modules` by climbing from the target repo root, so a `/tmp` fixture
dies with "Module ts-jest in the transform option was not found" before reaching anything
under test. A scratch dir created UNDER this repo resolves fine — the climb reaches the
monorepo root — and `assayer unit` then runs end to end against it. That is how the funnelled-
harness fix was proved through `packages/cli/dist/bin/assayer.js`.

So a one-off end-to-end check needs no fixture repo, only the right parent. Standing coverage
still belongs against the smoke-repo (`run-console.e2e.ts`, `run-unit-broker.integration.test.ts`),
which is a real npm workspace rather than a dir that has to be cleaned up.

The generic non-`CliExactOutputError` catch-all in `packages/cli/bin/assayer.ts` stays
unreached for an unrelated reason: it needs a manufactured runtime exception thrown through
the real compiled pipeline.

## G. Invariants held by convention rather than by a rule

### G1. `??` silently discards a legitimate `null` from a derived value

`null` is a first-class member of the domain — `representative-value-contract.ts` states it:
"`null` is a value in the domain because a nullish operand HAS one." The `non-nullish` case
of `typeToRangeTransformer` produces its violating arm as exactly `{ members: [null] }`,
which is what drives every `config.mode ?? fallback` object-member guard.

So `a ?? b` over a derived value substitutes `b` for a correct `null`, and the generated case
stops exercising the branch it names — while passing.

It has bitten six times, in six unrelated places: `objectArrangeTransformer`'s three chains,
`typeToRangeTransformer`'s `literal ?? rep`, a candidate filter that rejected `null` for a
`string`-typed operand, that filter's first replacement, `isTypeFillableGuard` refusing `null`
for every scalar kind, and `typeToRangeTransformer`'s `non-nullish` violating arm returning
`unrealizable` whenever the operand had no scalar representative. Each was fixed the same way,
with an explicit `=== undefined` check or by admitting `null` unconditionally.

The sixth is the one that says this needs a rule rather than vigilance: it was in a file already
fixed once for this exact class, and it was found by a systematic per-kind sweep rather than by
anything failing.

A second reason the eye is a bad detector here: the hermetic walk runs without
`strictNullChecks`, so the checker collapses `string | null` to plain `string` before Assayer
sees it. Code that reasons about nullability from the checker's type is reasoning about the
wrong thing, and it reads perfectly.

The rule that would stop it belongs to the `@dungeonmaster/eslint-plugin` in the sibling repo,
not here — this repo has no local rules directory. Until it exists the invariant is convention,
so a `??` anywhere near a `RepresentativeValue` or `ArrangeValue` is worth reading twice.

## Belongs to `@dungeonmaster/testing`, not here

`registerMock`'s stack-based dispatch routes a write to the wrong handle when a broker's own
write never fires (an early return) AND a sibling untracked write to the same underlying
`fs/promises.writeFile` happens elsewhere in the same call graph. Probed:
`manifestWriteBrokerProxy().getWrittenManifest()` returns a compiled blob rather than a
manifest. This is the exact collision stack dispatch exists to prevent.

## Not a defect, but know it

Compiling THIS monorepo with Assayer OOMs: `assayer status` against
`repoRoot=/home/brutus-home/projects/assayer` (1781 targets) dies with
`FATAL ERROR: Ineffective mark-compacts near heap limit`, exit 134, at ~3.3GB after 150s —
during the walk, before any stitch. It is why the harness symbol gate was proved by a
plan-broker probe plus byte-exact copies rather than by compiling the repo itself.
