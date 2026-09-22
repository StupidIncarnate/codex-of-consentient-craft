# @dungeonmaster/hydration

The framework behind the recipe book — ingredients, chains, plans and the runner. It ships. This
repo's own ingredients and recipes live in `packages/hydration-recipes`, which does not.

## The chain hands you HANDLES, never records

Nothing exists yet while the chain builds: `add`'s builder receives references to the rows it is
*about* to make, not the rows themselves. `q[0].id` cannot be read inside the builder and must not be
made readable — an id resolves only after a route runs, and it travels forward through
`saveRecordAs`.

## Every verb but `add` takes an object

A scalar names no axis: an ingredient growing a second thing to set — a second transition field, a
second option — would need a second verb if the existing one takes a scalar. An object just grows
another key, so options accrue in the same place instead. `add(n, build)` keeps its bare count
regardless, because the count is the only thing `add` could ever mean.

`all` follows the same shape, in reverse: it is `add`'s second BUILDER ARGUMENT, never a property
beside the handles. `Tuple<T, N> & { all: T }` silently loses the out-of-bounds check that makes
`q[3]` after `add(3, …)` a compile error — measured across four candidate shapes, only a tuple kept
pure by a second argument survives.

## ONE verb sets state, and `setRaw` is the odd one

Two verbs taking the same argument shape produce completely different states, and picking wrong
fails silently. `set` is the only way to put a value on a row; the ingredient decides whether that
value is walked. A plain field is written; a field named under `transitions` is walked through the
real gates.

`setRaw` writes the field and walks nothing. Its name is the warning — a deliberately inconsistent
row is a real need for an attack walk and a rare one, so nobody reaches for it by accident.

## `filter` selects rows that only exist at RUN time

`add` knows its count at build time; `filter` cannot — how many rows a transition minted is a fact
about the gates, not about the recipe. So a filtered set has NO index and NO `add`: the type says
the count is unknown.

`expect` defaults to `'some'`, and a zero match THROWS. This reuses the tool's own no-pick rule: a
filter matching nothing almost always means the row you meant to reach was never there, and
silently doing nothing is how that becomes a defect report against working code.

A `filter` inside a nested `add` is scoped to its immediate host, never the whole instance — the op
carries `scope`, and the runner matches only rows whose ancestor chain contains it. Matching every
row of that ingredient anywhere in the instance would let a recipe holding two guilds delete rows
belonging to a parent it did not create.

## A route lives on the INGREDIENT; the target picks which one runs

A recipe pinned to one route serves only the callers that offer it. Putting the choice on the
ingredient instead is what lets an integration test with no server into the catalogue at all: a
caller with no `baseUrl` can only run ingredients that declare a `write` route, and the types say
so.

## A `write` route must declare `copies:`

`copies:` names the production code that route's output imitates. Without the pointer, every
diagnosis of a broken ingredient opens with a hunt for the counterpart instead of starting there.

| Failed route | The diagnosis is |
|---|---|
| `api` | the real code path changed. Read the handler |
| `write` | diff what `copies:` writes NOW against what the ingredient writes — it is a copy that stopped matching |

## Every path a `write` route touches resolves inside the target it was handed

A `write` route may CREATE the directories its own output needs — a target is a bare directory and
nothing else stands them up — but it creates them only underneath the target, and it writes only
underneath the target. A route that reaches outside is the worst failure this framework has: the
seed reports success, the spec reads an empty target, and the directory that did get written is
somewhere no `cleanup()` will ever reach — the operator's own data directory, when the target is
that.

Two things make the check itself wrong more often than the rule:

- **Resolve before you compare.** A caller's path segment may carry `..`, so a string that begins
  with the target walks above it. Anchor the path on the target and normalise it, then compare.
- **Compare with the separator.** `startsWith(target)` alone accepts a SIBLING whose name merely
  begins with the target's own, and drops the write next to the target instead of in it.

What a route does with a path that fails the check is the ingredient's call, and the two answers
divide on whether the value has a legitimate life outside the target. A field naming something the
target OWNS — a record's own file — has none, so an outside path is bad data and the route throws,
naming the resolved path and the target. A field naming something the target merely POINTS AT — a
project directory on the operator's machine — legitimately sits outside, so the route records it as
given and creates nothing.

## Determinism is structural, not a rule to remember

The chain owns the index and hands it to `defaults(i)`. An ingredient never sees a clock and never
sees a random value, so the same plan run twice produces the same bytes.

**An ingredient must not call `Date.now()`, `Math.random()`, or `crypto.randomUUID()` for anything
that reaches a screen.** With the index supplied, that is the one door left open, which is why the
enforcement is a single lint rule over one folder rather than a convention every recipe has to
remember.

## A plan is DATA, and one plan runs three ways

The chain builds; it does not execute. Callbacks run at BUILD time, so calling a recipe materialises
the whole plan as data before anything touches disk or opens a socket.

| Caller | Hands the runner | Gets |
|---|---|---|
| a siege walk | the instance's throwaway home and the lane's base URL | every route |
| an end-to-end spec | the spec's home and Playwright's `baseURL` | every route |
| an integration test | a temp dir, no base URL | write routes only |

The listing (`recipes {}`) prints the plan itself, so there is nothing for a hand-written
description to drift from.

## Neither tsconfig may carry a comment

Ward's typecheck broker (`packages/ward/src/brokers/check-run/typecheck/check-run-typecheck-broker.ts`)
parses `tsconfig.json` as strict JSON and its `catch` swallows a parse failure, leaving an empty
object behind. A comment does not fail loudly — it silently costs the package its real `include` and
`exclude`, and ward discovers the wrong file set. Strip a comment on sight; the reasoning it carried
lives in the table below instead.

| `exclude` entry | File | What it is for |
|---|---|---|
| `test/adapter-fixtures/**` | `tsconfig.json` | `typescriptProgramDiagnosticsAdapter`'s own test fixtures, carrying a deliberate compiler error the adapter compiles directly. The package's own checking `tsc` must skip them |
| `test/type-fixtures/declaration/**` | `tsconfig.json` | the declaration half of the negative type suite — nine malformed ingredient declarations (D1-D9), one deliberate error per file, graded by `typescriptProgramDiagnosticsAdapter` in `ingredient-declare-broker.test.ts`. Scoped to this one subdirectory, not the whole `test/type-fixtures/` tree: `dm-target.ts` and `sql-target.ts` are VALID TypeScript and stay under the package's own checking `tsc`. Each sibling case group (`call-site/`, `seed-step/`, `positive/`) adds its own narrow entry the same way |
| `src/adapters/typescript/program-diagnostics/**` | `tsconfig.build.json` | a test-only adapter that grades the negative type-fixture suite with a real `ts.createProgram`. A package that ships has no business bundling `typescript` as a runtime dependency, so this never reaches `dist` |

## Ward runs this package's jest with `cwd` set to the package directory

`process.cwd()` inside a test resolves to `packages/hydration`, never the repo root, under a real
ward run. Anything owning fixtures resolves paths through the compiler adapter, which walks up from
`__dirname`, rather than resolving them itself.

## The `exports` map has no `./adapters` subpath, and that is deliberate

`contracts.ts`, `brokers.ts`, `transformers.ts` and `errors.ts` are the whole public surface.
`src/adapters/` holds three things and none belongs on it: the TypeScript-diagnostics adapter is
test-only and already sits outside `tsconfig.build.json`'s emit; `fetchPostAdapter` and
`fsEnsureWriteAdapter` are route helpers the runner calls internally, not something a recipe or a
spec ever imports directly. Adding a `./adapters` subpath later is a decision to make deliberately,
not a gap to fill by matching what `@dungeonmaster/shared` happens to export.

`hydrationCreateBroker` returns `{ ingredient, registry, recipe, run, listing }`. `run` is the public
name a spec tree reaches with no MCP boundary, and it calls `planRunBroker` against whichever
ingredients that same binding's `registry()` call registered — `brokers.ts` also exports
`planRunBroker` directly, for a caller that builds its own ingredient list instead of going through
this broker's binding. `listing` reads the SAME `registeredIngredients` closure `run` reads, folding
`planRunsTransformer` and `planMakesTransformer` over one plan without asking the caller to hand its
own ingredient list back in.

## `HydrationTransactionRolledBackError` has no thrower in this package, by design

Nothing inside this framework throws it — the framework names neither files nor SQL and does not own
a transaction. The TARGET is the transaction, and it belongs to the repo: a database-backed repo's own
wrapper around `run()` begins the transaction, catches the runner's per-op rejection, rolls back, and
throws this naming the op that triggered it. The class stays exported for that wrapper to throw, even
though no code in this checkout is the wrapper.

Driving this for real would need a real database engine as a dependency, a schema with a real
constraint, and a consumer's own wrapper that begins a transaction, catches the runner's rejection,
rolls back and throws this class naming the op. None of that has an honest home in this repo, because
dungeonmaster's own state is files.

## `require-zod-on-primitives` still applies inside this package's carve-out

The `ban-primitives` entry in `eslint.config.js` for this package covers only the framework's
generic machinery — `N extends number`, `of: string` — and nothing else. **`require-zod-on-primitives`
is a different rule**, and it still fires inside `src/contracts/**`: a bare `string` or `number`
field on a contract needs its own inline `.brand<…>()`.
