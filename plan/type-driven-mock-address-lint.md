# Type-driven lint: a mock may not describe a call as `[]` when the function requires arguments

**Status:** not started. Scoping doc.
**Package:** `@dungeonmaster/eslint-plugin` (published; other repos consume it).
**Prerequisite:** none. The mocking API this rule polices is already shipped and the repo is green.

---

## 1. What the mocking API does, in one page

You need this to understand the rule. Call `get-testing-patterns` (MCP tool) for the full version.

A proxy mocks a function and **describes calls by their arguments**:

```ts
const handle = registerMock({ fn: readFile });

handle.calledWith(['/a/manifest.json']).resolves(manifestJson);
handle.calledWith(['/a/bundle.js']).resolves(compiledBlob);
```

Each call gets the value written down for its own path. The order the code reads in is irrelevant.

Three methods on a handle:

| method | meaning |
|---|---|
| `handle.calledWith([args])` | describe a call + what it gets back; applies to **every** matching call |
| `handle.onceFor([args])` | same, applies **once** — for when identical calls must get different results |
| `handle.callsMatching([args])` | which calls actually happened with these arguments; for assertions |

`calledWith` / `onceFor` return `{ returns, resolves, rejects, throws, implement }`.

Matching rules that matter here:

- **Describing fewer arguments than the call passes is a PREFIX match.** `['/a/f.json']` matches
  `readFile('/a/f.json', 'utf8')`. This is deliberate and common — a proxy that only cares about the
  path should not have to mention the encoding.
- **`[]` matches anything, at the lowest possible specificity.** It is the explicit catch-all.
- A call matching no description **throws**, naming both what was asked for and what was described.
  The sole exception is `registerSpyOn({ passthrough: true })`, where the real implementation is the
  catch-all and nothing throws.

## 2. The defect this rule catches

`calledWith([])` on a function that takes an identifying argument is a lie. It reads as "describe a
call" but means "answer everything", so staging becomes order-coupled again — the exact behaviour the
argument-addressed API replaced.

**Live example, in a sibling repo** (`/home/brutus-home/projects/assayer`,
`packages/core/src/adapters/fs/exists/fs-exists-adapter.proxy.ts`):

```ts
const handle = registerMock({ fn: access });          // access(path: PathLike, mode?: number)

handle.calledWith([]).resolves(undefined);            // constructor catch-all

return {
  succeeds: () => handle.onceFor([]).resolves(undefined),                 // "the NEXT call, whichever path"
  fails:    () => handle.onceFor([]).rejects(new Error('ENOENT: …')),     // "the NEXT call, whichever path"
  callCount: () => fileCountContract.parse(handle.callsMatching([]).length),
};
```

A test staging `succeeds()` for one path and `fails()` for another gets them paired by whatever order
the implementation happens to call in. It does not fail — it passes, testing something other than
what it says.

The correct shape:

```ts
succeeds: ({ filePath }: { filePath: FilePath }): void =>
  handle.calledWith([filePath]).resolves(undefined),
fails: ({ filePath }: { filePath: FilePath }): void =>
  handle.calledWith([filePath]).rejects(new Error('ENOENT: …')),
```

## 3. The approach: read arity off the type checker, not off a list

A hand-maintained table of "which npm functions take a path" was considered and **rejected**: a
missing entry means the rule is silently wrong, and it cannot cover third-party packages.

`@dungeonmaster/eslint-plugin` already runs type-aware rules (`project: './tsconfig.json'`), so the
required arity is available directly:

```
getTypeAtLocation(<the identifier passed as `fn`>)
  → checker.getSignaturesOfType(type, ts.SignatureKind.Call)
  → signature.getParameters()
  → count the parameters that are NOT optional
```

| function | required arity |
|---|---|
| `access(path, mode?)` | 1 |
| `readFile(path, options?)` | 1 |
| `writeFile(file, data, options?)` | 2 |
| `crypto.randomUUID(options?)` | 0 |
| `Date.now()` | 0 |
| `Math.random()` | 0 |
| `process.cwd()` | 0 |
| `os.homedir()` | 0 |

**The rule:** when required arity ≥ 1, a description must name **at least one** argument.

Not full arity — prefix matching is a feature, and describing the path but not the encoding is
usually the right answer.

### Why this is the whole point

The "genuinely argument-less" allowlist stops existing. `randomUUID`, `Date.now`, `Math.random`,
`cwd`, `homedir` pass because they report arity 0, not because somebody remembered to list them.

It works for any third-party package that ships types (`axios`, `glob`, …). A package typed `any`
yields no call signatures and the rule stays silent — the correct failure direction.

It also generalises past npm to this repo's own code: `registerMock({ fn: someBroker })` where the
broker takes `({ questId }: { questId: QuestId })` is arity 1, so `calledWith([{ questId }])` becomes
required. Objects compare only on the keys you write, so that is cheap to satisfy.

## 4. The design tension you must resolve — read before writing code

`process.stdout.write(buffer, cb?)` has required arity 1. A naive rule therefore flags the
**record-and-swallow spy**, which is a deliberate, documented, sanctioned pattern:

```ts
const stdoutWrite = registerSpyOn({ object: process.stdout, method: 'write' });

stdoutWrite.calledWith([]).returns(true);   // suppress; correctness comes from the assertion below

getStdoutOutput: () => stdoutWrite.callsMatching([]).map((call) => call[0]),
```

Here `[]` is honest: the proxy's job is to swallow every write, and each test asserts the captured
text separately via `callsMatching`. The address is not the discriminator.

**Proposed resolution — positional, not an opt-out list:**

- `calledWith([])` **in the proxy constructor** → allowed. That *is* the documented explicit catch-all.
- `calledWith([])` / `onceFor([])` **inside a setup method on the returned object** → flagged. A setup
  method exists to describe a specific scenario; if it describes nothing, it is order-coupled.

That split passes the stdout/stderr/`console.error` spies and still catches the assayer example
exactly: its constructor default is allowed, its `succeeds()` / `fails()` are flagged.

**This is a proposal, not a decision.** Validate it against the real corpus before committing —
`packages/testing`, `packages/shared` and `packages/orchestrator` have the densest proxies.

### Hard evidence that the split is load-bearing

A runtime guard was built and measured against this exact question, then reverted. It threw whenever
two *different files* both described one function at `calledWith([])`. Result:

| package | outcome |
|---|---|
| `packages/orchestrator` | **386 failures / 430 files (~90%)** |
| `packages/shared` | 473/473 pass |
| `packages/server` | 157/157 pass |

The conclusion is not "orchestrator is broken". It is that **two proxies describing one function at
`[]` is the normal composition pattern, not a defect**. A broker proxy and the adapter proxy it
composes each stage their own `calledWith([])` default on the same global (`Date.now`,
`crypto.randomUUID`, `console.error`, `process.stdout.write`) — each correct in isolation.

A documented, sanctioned instance: `packages/shared`, `packages/config` and `packages/orchestrator`
each independently stage `calledWith([]).implement(realPath.join)` on `path.join` as a real
passthrough default, deliberately, with an explanatory comment.

**Consequence for this rule:** a version that flags constructor-level `[]` would fire on roughly 90%
of orchestrator's proxies. The constructor-vs-setup-method split is therefore not a nicety — it is
the thing that makes the rule shippable at all. Validate the split's false-positive rate on
`packages/orchestrator` specifically before building the rest.

## 5. Scope notes

1. **Handle tracking.** Linking `const handle = registerMock({ fn: X })` to a later
   `handle.calledWith(...)` needs ESLint scope analysis (`context.getScope()`, walk the variable's
   references). Straightforward for this repo's one-function-per-file proxy shape; degrades if a
   handle is passed to a helper, destructured, or returned. Decide whether to skip those or report
   them as unanalysable.

2. **Overloads.** `readFile` and friends have several signatures. Take the **minimum** required arity
   across all call signatures, so an all-optional overload cannot produce a false positive.

3. **`registerSpyOn`.** The type comes from the object + method, not an `fn:` identifier — resolve via
   `checker.getPropertyOfType(typeOfObject, methodName)`. `Date.prototype.toISOString` is arity 0 and
   must pass. Note a spy cannot see the receiver, so the receiver is never an available address.

4. **`passthrough: true` spies never throw at all**, so `[]` on them is always legitimate.

5. **Performance.** Type-aware rules are slower, but this repo already runs several. One
   `getTypeAtLocation` per `registerMock` call site is cheap.

## 6. What this rule will NOT catch

`callsMatching([]).length` — counting *all* calls is legitimately what some tests mean, and nothing
can distinguish that from "I meant this path and forgot to say so." Out of scope.

A separate, purely syntactic rule covers the sharper version of that shape
(`callsMatching([]).at(-1)`, which answers "whatever ran last") — see §8.

## 7. Registration — all five steps are mandatory

`packages/eslint-plugin/CLAUDE.md` is binding. Missing a step means the rule silently does not run,
and `src/dungeonmaster-rule-enforce-on.integration.test.ts` fails if step 5 is skipped.

1. Rule broker in `src/brokers/rule/{name}/`
2. Colocated RuleTester tests (rule brokers use ESLint's RuleTester, not describe/it)
3. Register in `src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts` — import, the
   rules **type**, the rules **object** — plus its `.proxy.ts` and `.test.ts`
   (note: the package CLAUDE.md says `src/startup/start-eslint-plugin.ts`, but that file only
   delegates through `flows/` → `responders/`; the responder is where every rule is actually wired)
4. Add to `src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts` at `'error'`
5. Categorise in `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`
   — this rule needs **`post-edit`**, because it requires type information, not just AST
   (`pre-edit` is for AST-only rules). Update that statics test.

Two integration tests also assert the full rule list and will need the new entry:
`src/flows/eslint-plugin/eslint-plugin-flow.integration.test.ts` and
`src/startup/start-eslint-plugin.integration.test.ts`. Both use `toStrictEqual` on the sorted rule
names — add the entry in position, do not weaken to `toContain`.

Use the shared `Tsestree` contract for AST nodes; ad-hoc interfaces fail `@dungeonmaster/ban-adhoc-types`.
See `packages/eslint-plugin/src/brokers/rule/CLAUDE.md`.

## 8. Adjacent work, deliberately not bundled here

- **Ban `callsMatching([]).at(-1)`** — purely syntactic, no type info, different rule. Tracked
  separately and being built independently.
- **`.returns()` vs `.resolves()`** — flag `.returns()` on a Promise-returning function. Uses the same
  type-checker machinery as this rule, so it is cheap to build alongside once the plumbing exists.
  Lower value on its own: it already fails loudly at runtime with `fetch(...).then is not a function`.
- **Strengthen `enforce-proxy-param-binding`** — that rule catches a property declared in a
  parameter's type but never bound. It does not catch a property bound and then discarded
  (`{ guildId: _guildId }`), which is the same lie in a different spelling. Purely syntactic; needs a
  body scope-walk for identifier references and care not to false-positive on legitimately unused
  destructures.

## 9. Verifying

```bash
npm run build                 # its own command; confirm exit 0 before trusting any ward result
npm run ward -- --only lint,typecheck,unit,integration -- packages/eslint-plugin
```

Then run the rule across the real corpus and read what it flags before deciding it is right:

```bash
npm run ward -- --only lint -- packages/testing packages/shared packages/orchestrator
```

Never `cd` into a package. Never pipe the build — piping discards its exit code.
