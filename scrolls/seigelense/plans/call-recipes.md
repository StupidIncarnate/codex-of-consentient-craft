# `dungeonmaster siegelense recipes` — the call and the recipe book

Spec: `scrolls/seigelense/siegelense-tooling.md` (Part 6 at 1932, the call at 2314, interleaving at 2884) and
`scrolls/seigelense/siegelense-recipes.md` (3A at 262, Part 5 at 375).

## 1. Requirements

One row per distinct thing the spec says `recipes` and the recipe book must do. `T` = `siegelense-tooling.md`,
`R` = `siegelense-recipes.md`.

| #   | Requirement                                                                                          | Cite       |
|-----|------------------------------------------------------------------------------------------------------|------------|
| R1  | `recipes {}` takes no argument and needs no live instance — it holds no pool slot                    | T2314, T2275 |
| R2  | It lists every recipe NAME                                                                            | T1982, T2317 |
| R3  | Each entry carries its `produces:` prose — one line, so a session picks without reading the script     | T1982, R424 |
| R4  | Each entry carries its `fidelity`                                                                     | T1982, R425 |
| R5  | Listable WITHOUT being RUN — `produces:`, `fidelity` and `mirrors:` are static data the tool reads     | T1995, R273 |
| R6  | `mirrors:` is declared wherever fidelity is `direct`                                                  | R426, R282 |
| R7  | Fidelity is exactly three values — `production`, `direct`, `captured` — each declaring its own risk    | R429-435   |
| R8  | A recipe declares the ids it returns; a walk cannot address what it cannot name                       | R427, R505 |
| R9  | A recipe takes its dependencies EXPLICITLY, as named parameters                                       | R281, R711 |
| R10 | `session-with-nested-subagent` — "one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished", fidelity `direct` | T2318-2320 |
| R11 | `guild-with-three-quests` — "one guild holding three quests, one in_progress", fidelity `production`   | T2321-2322 |
| R12 | Recipes live at `packages/siegelense-recipes/` — that exact path, in every repo                        | T1960, T1970 |
| R13 | An EMPTY recipes package is a real answer; a MISSING one is not, and the two must not read alike       | T1977-1980 |
| R14 | `dungeonmaster init` scaffolds the package                                                            | T1973      |
| R15 | A recipe touches STATE, never a screen — no ref, no selector, no position, no assertion about a render | R471, R266 |
| R16 | Recipes are a real workspace package, so their tests get a ward run                                   | T1999, R274 |
| R17 | Each barrel is subpath-importable and pulls no msw behind it                                          | T2004      |
| R18 | Every recipe carries a colocated integration test asserting its own `produces:`                       | R548, R275 |
| R19 | The call is reached as `dungeonmaster siegelense recipes`                                             | T2270      |
| R20 | Recipes COMPOSE — a later one stacks onto an earlier one's returned ids rather than building a world   | R450, T2905 |
| R21 | A `direct` recipe's test asserts against its `mirrors:` output, never a hardcoded snapshot            | R277, R572 |
| R22 | Production-fidelity recipes share ONE instance for the whole suite; `direct` ones need none            | R278, R580 |
| R23 | In a consumer repo the convention travels and the recipes do not                                      | T2010, R718 |
| R24 | `seed` is a STEP, placeable anywhere in a batch, not a prologue                                        | T2886, R284 |

## 2. The judgment call — EXECUTION versus DECLARATION-AND-LISTING

**Execution does not land this pass. Declaration and listing land complete.**

Three reasons, in order of weight:

1. **A recipe built now would have no caller.** Running a recipe happens through the `seed` STEP (T2886), which is
   unbuilt, and whose home — `packages/siegelense/src/brokers/step/**` and `run-execute-broker.ts` — is outside this
   agent's owned paths. `start --seed` (T2281) belongs to another agent this wave. An executable recipe broker with
   no call site is code ward grades and nothing exercises.
2. **The `production` recipe cannot be tested without `start`.** R580 is explicit: a production-fidelity recipe calls
   a real route, so its suite shares ONE booted instance. Standing that instance up IS `start`. Building
   `guild-with-three-quests` as a real HTTP caller with no way to run it against a real server would ship the exact
   thing `fidelity` exists to warn about — a fixture nobody proved.
3. **The call's own contract is satisfied by declaration alone.** T1995: *"Each recipe must be LISTABLE without being
   RUN. `produces:`, `fidelity` and `mirrors:` are static data the tool reads — never something it learns by
   executing."* Nothing in `recipes` reads a recipe's body.

What ships instead of a half-executable recipe is a **typed declaration that `start` and `seed` can code against**:
each manifest names its `parameters` and its `returns`, taken from the spec's own worked examples
(`{g.guildSlug}`, `{g.questId}`, `{s.sessions.nested}` at T2895/T2900/T2917). Section 6 names the follow-up work
file by file.

## 3. The recipe manifest data model

Owned by `packages/siegelense-recipes` — the package that owns the recipes owns their shape. The dependency runs one
way, `siegelense` → `siegelense-recipes`, so nothing is circular.

```
RecipeManifest {
  name        RecipeName            kebab, the lookup key a `seed` step names
  produces    RecipeProduces        the one-line claim; R3
  fidelity    RecipeFidelity        'production' | 'direct' | 'captured'; R4, R7
  mirrors     RecipeMirrors | null  REQUIRED when fidelity is 'direct', null otherwise; R6
  parameters  RecipeParameter[]     { name, description, required } — explicit dependencies; R9
  returns     RecipeReturn[]        { name, description } — the ids a walk addresses by; R8
}
```

Two refinements the contract enforces rather than documents:

- `fidelity === 'direct'` with `mirrors === null` is rejected. R282: *"a `direct` recipe must declare `mirrors:`"* —
  without the pointer every diagnosis opens with a hunt for it.
- `fidelity !== 'direct'` with a non-null `mirrors` is rejected. A `production` recipe calls the real code path, so it
  has no counterpart to drift from, and a pointer there says something untrue.

`needsInstance` is NOT a manifest field. It is a property of the fidelity (`recipeFidelityStatics`), because R278/R580
derive it from exactly that — duplicating it per recipe is a second place for the two to disagree.

**R15 is held by the SHAPE**: the manifest has no field a DOM handle could live in — no selector, no ref, no rect, no
URL of a screen. A recipe that wanted one would have to grow a field, which is a review, not a typo. The lint half of
R15 (Part 7 item 16's open half) stays open and ships with executable recipes.

## 4. Discovery — how the listing finds the book

`recipeBookReadBroker` does two things, in this order:

1. **Presence.** Resolve `<repoRoot>/packages/siegelense-recipes` and check it exists. Absent →
   `RecipePackageMissingError` naming the expected path and `dungeonmaster init`. This is R13's whole point: an absent
   folder can only say *something is wrong*, and must not answer the same way as a folder holding no recipes.
2. **The book.** Map `recipeBookStatics.recipes` through `recipeManifestContract`, sorted by name, into
   `RecipesAnswer`. An empty book is `{ recipes: [] }` and the renderer says so in words — the *no recipes yet* answer.

The book is STATIC DATA, which is R5 read literally. The listing and a future runner read the same declaration
(R713), because a recipe's seed broker will import its own entry from this same statics rather than restating it.

**Known limit, stated rather than hidden (R23).** The book is compiled data inside the published
`@dungeonmaster/siegelense-recipes`, so a CONSUMER repo writing its own recipes into its own scaffolded
`packages/siegelense-recipes/` gets an accurate *no recipes yet* for ours and no listing of theirs. That is the same
class of open question as T2031's `../../packages` monorepo limit — the package NAME is the convention, the
enumeration mechanism for a consumer's own source is not settled. The presence check is what keeps the two answers
distinguishable today.

## 5. Build list

Folder type in brackets. Every implementation file carries a PURPOSE/USAGE header above its imports.

### `packages/siegelense-recipes`

| File                                                        | Type       | Holds |
|-------------------------------------------------------------|------------|-------|
| `src/statics/recipe-fidelity/recipe-fidelity-statics.ts`     | statics    | the three values, each with `means`, `risk`, `needsInstance` |
| `src/contracts/recipe-fidelity/recipe-fidelity-contract.ts`  | contracts  | enum derived from the statics keys |
| `src/contracts/recipe-name/recipe-name-contract.ts`          | contracts  | branded kebab name |
| `src/contracts/recipe-manifest/recipe-manifest-contract.ts`  | contracts  | the shape in §3, with both refinements |
| `src/statics/recipe-book/recipe-book-statics.ts`             | statics    | THE BOOK — the two recipes, verbatim spec text |
| `contracts.ts`                                               | barrel     | new |
| `statics.ts`                                                 | barrel     | extended |
| `package.json`                                               | config     | `zod` + `@dungeonmaster/shared` deps, `./contracts` export |

### `packages/siegelense`

| File                                                                          | Type        | Holds |
|--------------------------------------------------------------------------------|-------------|-------|
| `src/statics/recipe-location/recipe-location-statics.ts`                        | statics     | `packages` / `siegelense-recipes` dir names |
| `src/errors/recipe-package-missing/recipe-package-missing-error.ts`             | errors      | the R13 refusal |
| `src/brokers/locations/recipes-package-path-find/…-broker.ts`                   | brokers     | `<repoRoot>/packages/siegelense-recipes` |
| `src/contracts/recipes-args/recipes-args-contract.ts`                           | contracts   | `{ human }` |
| `src/contracts/recipes-answer/recipes-answer-contract.ts`                       | contracts   | `{ recipes }` |
| `src/brokers/recipe/book-read/recipe-book-read-broker.ts`                       | brokers     | §4 |
| `src/transformers/recipes-args-parse/recipes-args-parse-transformer.ts`         | transformers| argv → `RecipesArgs` |
| `src/transformers/recipes-answer-render/recipes-answer-render-transformer.ts`   | transformers| the human listing, T2317-2322's own shape |
| `src/responders/siegelense/recipes/siegelense-recipes-responder.ts`             | responders  | JSON by default, table on `--human` |
| `package.json`                                                                  | config      | `@dungeonmaster/siegelense-recipes` dep |

`recipes` DOES support `--human`, because it ships a renderer. `SiegelenseFlow`'s `HUMAN_RENDERER_CALLS` is derived
from each call's own help flags, so the coordinator adding `HUMAN_FLAG` to the help entry is the only wiring that
needs — no second list.

## 6. Test list

Every test asserts a real value. The listed content assertions name the exact `produces:` string and the exact
fidelity per entry — a count-only assertion is the failure mode this list exists to refuse.

| Test | Cases |
|---|---|
| `recipe-fidelity-statics.test.ts` | the complete three-key object, `toStrictEqual`; `needsInstance` true only for `production` |
| `recipe-fidelity-contract.test.ts` | each of the three parses to itself (`it.each` over the statics keys); a fourth value throws |
| `recipe-name-contract.test.ts` | a kebab name parses; empty throws; an upper-case / space name throws |
| `recipe-manifest-contract.test.ts` | a full manifest round-trips whole; `direct` + `mirrors: null` throws naming the rule; `production` + non-null `mirrors` throws; a missing `produces` throws |
| `recipe-book-statics.test.ts` | the whole book `toStrictEqual` — both names, both `produces:` strings verbatim, both fidelities, both parameter and return lists |
| `recipe-location-statics.test.ts` | the complete object |
| `recipe-package-missing-error.test.ts` | `{name, message}` complete, naming the path and `dungeonmaster init` |
| `locations-recipes-package-path-find-broker.test.ts` | resolves `<repoRoot>/packages/siegelense-recipes` from a cwd deeper in the tree |
| `recipes-args-contract.test.ts` | `{human:false}` parses; an unknown key throws (`.strict()`) |
| `recipes-answer-contract.test.ts` | an empty list parses; a two-entry list round-trips whole |
| `recipe-book-read-broker.test.ts` | package present → BOTH manifests with their real `produces:` and `fidelity`, sorted; package absent → `RecipePackageMissingError` |
| `recipes-args-parse-transformer.test.ts` | `[]`; `['--human']`; `['--json']`; unknown flag refuses naming it; a positional refuses |
| `recipes-answer-render-transformer.test.ts` | empty → the *no recipes yet* sentence; two entries → the exact block, `produces:` and `fidelity:` per entry, wrapped as the spec prints it |
| `siegelense-recipes-responder.test.ts` | `human:false` → the exact JSON document; `human:true` → the exact table; empty book on both paths |

No `.integration.test.ts`. The only disk touch in this slice is one existence check, and that is graded at the adapter
boundary by the broker's unit test — a testbed would re-prove `fs.existsSync`. The cases that genuinely need a process
are flow-level and belong in `siegelense-flow.integration.test.ts`, which the coordinator owns; they are listed in
`tmp/siegelense-wiring/recipes.md`.

## 7. What `start` and `seed` need next, file by file

Not this pass, and not this agent's paths. Recorded so the next one does not re-derive it.

| Work | File |
|---|---|
| `--seed <recipeName>` on `start`'s argv | `packages/siegelense/src/transformers/start-args-parse/start-args-parse-transformer.ts` |
| `seed` on the start args shape | `packages/siegelense/src/contracts/start-args/start-args-contract.ts` |
| running the named recipe against the new lane's throwaway home, and putting its returned ids on the manifest's `seeded` (T2286) | `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts` |
| `seeded` on the manifest | `packages/siegelense/src/contracts/instance-manifest/instance-manifest-contract.ts` |
| `seed` as a step verb | `packages/siegelense/src/statics/step/step-statics.ts` → `verbs.all` |
| the `seed` step's dispatch, and `as:` naming its output | `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.ts`, `brokers/run/execute/run-execute-broker.ts` |
| the executable recipes themselves, one broker per recipe | `packages/siegelense-recipes/src/brokers/<recipe-name>/seed/` |
| the DOM-handle lint rule over recipe files (Part 7 item 16's open half) | `packages/local-eslint/src/brokers/rule/` |

A `seed` step resolves a recipe by calling `recipeBookReadBroker` and matching `RecipeName`, so the lookup the call
already ships is the lookup the runner uses. That is what keeps T713 true: the listing and the runner read one
declaration.
