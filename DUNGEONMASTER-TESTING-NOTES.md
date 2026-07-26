# `@dungeonmaster/testing` — handoff to Assayer

Every item raised from Assayer was reproduced against the real dispatcher. This records what the
package now does, what Assayer has to change to match, and what is still open.

Dungeonmaster is green at `bbb34055` (lint 6392, typecheck 6372, unit 2249, integration 100, e2e 55).

---

## What changed: staging is addressed by arguments

`registerMock` handles stage answers by **the arguments a mocked function receives**, not by call
order. Staging is shared across every proxy that mocks that function — one function, one behaviour,
the way prod behaves.

```ts
const handle = registerMock({ fn: readFile });

handle.calledWith(['/a/quest.json']).resolves(questJson);     // sticky, answers every matching call
handle.calledWith(['/a/manifest.json']).resolves(manifestJson);

handle.onceFor(['/a/quest.json']).resolves(firstReadOnly);    // one-shot, same key, different answer

handle.callsMatching(['/out/manifest.json']);                 // recorded calls for that address
```

`.calledWith` / `.onceFor` return `{ returns, resolves, rejects, throws, implement }`.

**Matching rules**

- Staging fewer arguments than the call passes is a **prefix match** — `['/a/f.json']` matches
  `readFile('/a/f.json', 'utf8')`, so a proxy that only cares about the path ignores the encoding.
- Objects match by **subset** — `{ nodir: true }` matches `glob(p, { nodir: true, cwd, ignore })`.
  A test never has to spell out the full options bag the implementation happens to pass.
- Arrays match element-wise at equal length. `RegExp` matches a string, `Date` matches by time, and a
  **function is a predicate** — the escape hatch for values a test cannot reconstruct (tmp dirs,
  `require.resolve` output, timestamps).
- **Most specific staging wins.** At equal specificity a live one-shot beats a sticky one, then the
  most recently staged wins, so a test can override a proxy's default.

**Unmatched calls throw**, naming both the call's own arguments and everything staged:

```
registerMock: no staged response for glob("/default/cwd/**/*.ts", {"cwd":"/default/cwd","nodir":true,...}).
Staged: ("**/*.ts", {"nodir":true})
```

The exception: if the proxy declared an explicit base default (`mockResolvedValue` /
`mockImplementation`), that is used as the catch-all instead of throwing. Keep a default when a
composing proxy legitimately instantiates the adapter without staging anything; drop it when it is
just "anything returns empty", which is a false-green generator.

The old `mockResolvedValueOnce` / `mockReturnValueOnce` queue still works and is still correct for
calls with no meaningful address (`Date.now`, `crypto.randomUUID`, a free-port lookup).

---

## Item-by-item

### 1. A write mis-attributed to an idle proxy's handle — **fixed, root cause was one level down**

Confirmed with a passing repro. The cause is not stack-based dispatch: it is that proxies queue canned
values in call order and never look at the path. In Assayer,
`packages/desktop/src/adapters/node-fs/read-source/node-fs-read-source-adapter.proxy.ts` and
`packages/desktop/src/adapters/node-fs/read-cache-blob/node-fs-read-cache-blob-adapter.proxy.ts` both
call `registerMock({ fn: readFile })` on `node:fs/promises` and both queue values without a path
check. A source read and a cache-blob read draw from the same queue in call order, so
`getWrittenManifest()` was handed whatever came next. Key both on their path and it cannot happen.

**A rejected fix, so nobody re-proposes it:** scoping handle identity to the composing proxy (walking
the stack for the parent frame) was built, measured and reverted. It makes two parts of one call chain
able to get *different* answers for the same file — further from prod, not closer. It also produced
24–61 red test files across three heuristic iterations, and the results reshuffled with stack depth
because V8 truncates stacks to 10 frames by default.

### 2. A child proxy can be silently inert — **still open, unchanged**

Accurate as written, with one correction: the ts-jest transformer does not always auto-mock the target
as a bare `jest.fn()`. For a direct named import it emits a selective factory
`() => ({ ...jest.requireActual(m), name: jest.fn() })`; only property-access, default and namespace
imports produce a whole-module automock. Either way the registered function itself becomes a bare
`jest.fn()` for the entire test, an unmatched dispatch returns `undefined` (there is no passthrough,
because the real implementation is only captured when one already existed), and a handle composed one
level below is never reached.

So the guidance stands: **register the wrapper the code actually calls.** Composing a child adapter
proxy to control the level below is a no-op whenever any sibling proxy in the test's graph registers
the wrapper. Nothing detects this yet — the suggestion of surfacing an unreached staged handle, or
warning when two proxies register the same target, is not implemented.

### 3. "A proxy helper no test calls" is not a dead-code signal — **accurate, nothing to fix**

Correct, and inherent to the architecture: the proxy-encapsulation rule requires a parent proxy to
delegate to its children's semantic methods, so "unused in its own test file" is the expected shape.
No rule in either repo does per-file dead-helper detection, so nothing is currently wrong. It stays a
prerequisite for ever automating that heuristic.

### 4a. Lint blocks `{ ...WalkFactsStub() }` — **fixed**

The rule is `@dungeonmaster/enforce-stub-usage`, not `enforce-stub-patterns` (which only runs on
`*.stub.ts`). It is a **pre-edit** rule, so it blocks the write rather than failing later. It now
exempts an object literal whose properties are **all** spreads of `*Stub()` calls — that is stub usage,
and it is the only way to reach a shape a stub cannot return, since every stub ends in
`contract.parse()`. `{ ...UserStub(), name: 'x' }` is still a violation: pass overrides to the stub.

`max-nested-callbacks` is confirmed at `{ max: 4 }`; hoisting a `.filter()` out of an `expect(() => …)`
callback is the intended fix there.

### 4b. `enforce-proxy-patterns` forbids "stub" in a proxy helper name — **working as designed**

`proxyPatternsStatics.forbiddenWords` is `['mock', 'stub', 'fake', 'spy', 'jest', 'dummy']`, matched
case-insensitively as a substring anywhere in the property key. `getWrittenStubIndex` trips it. The
rule's purpose is to keep proxy helpers named for the scenario rather than the mechanism, so a rename
is the expected outcome. Raise it if a domain word keeps colliding.

---

## What Assayer needs to do

46 proxies call `registerMock`; 30 use an order-dependent queue and 22 read `handle.mock.calls`.

**Convert the staging.** Highest value first — these are the ones with a real address:

- `packages/desktop/src/adapters/node-fs/read-source/…proxy.ts` — key on the path
- `packages/desktop/src/adapters/node-fs/read-cache-blob/…proxy.ts` — key on the path (item 1)
- `packages/desktop/src/adapters/node-fs/read-stub-index/…proxy.ts`
- `packages/desktop/src/adapters/node-fs/read-resolved-index/…proxy.ts`
- `packages/desktop/src/adapters/node-fs/cache-manifest-exists/…proxy.ts`
- `packages/core/src/adapters/git/exec/git-exec-adapter.proxy.ts` — key on the git subcommand/args

**Convert the assertion readers too.** Staging alone does not fix item 1.
`readPath: () => handle.mock.calls.at(-1)?.[0]` still answers "whatever ran last". It becomes
`handle.callsMatching([path]).at(-1)?.[1]`, and the caller passes the path it means.

**Order-coupled tests that keying fixes** — these stage the same setter twice with different values and
are currently paired by call order:

- `packages/core/src/brokers/compose/cross-file-map/…test.ts` — `setupSibling` for two files
- `packages/core/src/brokers/compose/cross-file-predicates/…test.ts` — `setupSibling` over/under
- `packages/app/src/adapters/assayer-bridge/get-compiled-file/…test.ts` — `register` for two relPaths

**Genuine `onceFor` cases** — same address, result changes between calls:

- `packages/core/src/brokers/analyzer/hash/analyzer-hash-broker.test.ts` — `walkReturns` before/after
- `packages/core/src/brokers/compile/run/process-targets-layer-broker.test.ts` — `queueCleanWrite`

**Leave alone:** proxies whose mocked function has no useful address. Assayer's equivalent of
`crypto.randomBytes` keyed on `length` gains nothing when every call site passes the same constant.

---

## Gotchas learned converting this repo

**Verify the key actually reaches the npm function.** This is the one that bit hardest. Open the
adapter implementation next to the proxy and confirm the value the test stages is the argument the
mocked function receives. In Dungeonmaster's mcp package the *broker* rewrites the glob pattern before
the adapter sees it — it joins `cwd` on, and `globResolveTransformer` appends `/**/*` only when the
input has no wildcard and no extension. The proxy had been accepting a `pattern` that never equalled
glob's first argument, and nobody noticed because the queue never compared them. When the exact string
is not reconstructible at staging time, key on a predicate over the tail.

**When a broker's path comes from another mocked adapter, do not force a key.** Three mcp read-file
proxies stay on the queue because their brokers build the path via a `pathJoin` proxy that returns
`''`, or because the proxy's API has no path at all. Keying those would route every call to the
real-fs passthrough. Leaving them and saying why is the right answer.

**Expect the conversion to fail loudly, and read the failure as a finding.** It surfaced five
Dungeonmaster tests that passed without exercising what they claimed: a "custom pattern" case that
never used the custom pattern, a config read staged against a path absent from the code path, a
cross-project glob staged under the wrong pattern, a `throws` that fired on whatever wrote next, and
staged glob patterns that never matched. Each looked like a conversion bug and was a real one.

**Prove the keys are load-bearing.** Replacing a proxy's base default with a throw, then checking only
the tests that intentionally stage nothing fail, distinguishes "my keys work" from "everything is
quietly falling through to the default".
