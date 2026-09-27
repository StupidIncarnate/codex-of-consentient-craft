# G19: Gateway proxies use recorded failures and drop catch-all defaults

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 23, lines 559-569, and item 24, lines 571-581 |
| Needs | [G16](g16-gateway-stubs-node-and-failures.md) (the `ECONNREFUSED` recorded-failure stub this item's fix depends on); [G26](g26-per-file-proxy-and-stub-imports.md) (the per-file import form this item's fixes use) |
| Unblocks | nothing directly |
| Packages touched | `@gateway/npm` (`glob` proxy), `@gateway/node` (fetch and fs proxies), `@gateway/browser` (fetch proxy) |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no |

## Why

Two related bugs sit in the gateway's own proxies today. First, a proxy constructor should never stage
a "catch-all" default that answers a call no test described — a forgotten call then quietly succeeds,
and the I/O trap cannot catch it, because the call already counts as staged. Second, a proxy should
never let a caller hand it an arbitrary, invented `Error` for a failure scenario — a failure should come
from a recorded-failure stub carrying the platform's real fields, not a hand-made `Error` the test
author guessed the shape of. Both are enforced repo-wide later by lint rules T05 builds
(`ban-proxy-catch-all-defaults`, `ban-proxy-empty-called-with`, `ban-invented-failures`); this item is
just the gateway-side FIX, ahead of those rules going live.

## Current state

Checked 2026-09-26 against the code:

- **`packages/@gateway/npm/src/glob/glob/glob.proxy.ts` has exactly the catch-all default the source
  doc names:**

  ```typescript
  const handle = registerMock({ fn: glob });

  // Safe default, matching the retired mcp adapter proxy's constructor-time catch-all: a call this
  // test never described — a second, broader co-scan; a probe nobody staged — resolves empty
  // instead of throwing on an unaddressed call.
  handle.calledWith([]).resolves([]);
  ```

  This line needs to be deleted. The proxy also already has `returnsMatchingTail` /
  `throwsMatchingTail` (tolerant, tail-matched addressing) and `getOptionsFor` / `getCallsFor` (call
  read-back) — those stay; this item only removes the one catch-all line and its justifying comment.
- **`packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts` exists** and, per the source
  doc, already stages its second scan by name rather than relying on the catch-all — so it should keep
  passing once the catch-all is deleted. Confirm this with a real ward run after the delete rather than
  assuming; if it breaks, that broker's own proxy needs an explicit stage added, which is in scope for
  this item to fix (the fix belongs wherever the break actually is).
- **Both `fetchJsonProxy`s (`packages/@gateway/node/src/fetch/fetch-json/fetch-json.proxy.ts` and
  the browser twin at the same relative path under `@gateway/browser`) expose exactly the same
  any-`Error`-accepting shape:**

  ```typescript
  setupNetworkError: ({ url, error }: { url: string; error: Error }): void => {
    handle.calledWith([url]).rejects(error);
  },
  ```

  Both files are otherwise identical in this method. Both need to change.
- **The `node/fs` proxies with the same shape, confirmed on 2026-09-26** — every one of these exposes a
  `rejects` (or `rejects`-shaped) method that accepts `error: unknown` with no constraint at all:

  `packages/@gateway/node/src/fs__promises/read-file-if-exists/read-file-if-exists.proxy.ts`:
  ```typescript
  rejects: ({ path, error }: { path: string; error: unknown }): void => {
    handle.calledWith([path, 'utf8']).rejects(error);
  },
  ```

  `packages/@gateway/node/src/fs__promises/stat-if-exists/stat-if-exists.proxy.ts`:
  ```typescript
  rejects: ({ path, error }: { path: string; error: unknown }): void => {
    handle.calledWith([path]).rejects(error);
  },
  ```

  The source doc names the rest of the family with the same shape: `read-json-file`, `readdir`, and
  "the rest" under `fs__promises`. Check every proxy under `packages/@gateway/node/src/fs__promises/`
  for this exact `rejects: ({ ..., error: unknown }) => ...` shape — not only the two confirmed above —
  since the doc's own list is described as "known cases," not exhaustive.

## Work

1. **Delete the `glob` proxy's catch-all.** Remove
   `handle.calledWith([]).resolves([]);` (and its justifying comment) from
   `packages/@gateway/npm/src/glob/glob/glob.proxy.ts`. Run every test that uses `globProxy` (a
   scoped ward run against the files that import it) and fix any caller that was silently relying on
   the empty default rather than staging its own call explicitly — per the source doc, this is expected
   to be a short list, since `file-scanner-broker.proxy.ts` already stages by name.
2. **Replace `fetchJsonProxy`'s `setupNetworkError` with a named scenario built on a recorded
   `ECONNREFUSED` stub**, in both the node and browser copies:

   ```typescript
   // before
   setupNetworkError: ({ url, error }: { url: string; error: Error }): void => {
     handle.calledWith([url]).rejects(error);
   },

   // after — a named scenario, no caller-supplied Error
   setupConnectionRefused: ({ url }: { url: string }): void => {
     handle.calledWith([url]).rejects(ECONNREFUSEDStub());
   },
   ```

   Name the method to match what it now represents (`setupConnectionRefused` is a placeholder — pick
   whatever reads clearly against the proxy's existing method names, and record the final name under
   DECISIONS if it differs). Find every current caller of `setupNetworkError` and switch it to the new
   named method; if a caller genuinely needs a DIFFERENT network failure than connection-refused (a
   timeout, a reset), that is a second named method built on a second recorded-failure stub — do not
   let one method's rename become a dumping ground for every network failure shape by re-adding a raw
   `error: Error` parameter to keep old callers compiling.
3. **Replace every `node/fs__promises` proxy's raw `rejects({ ..., error: unknown })` with named
   scenarios built on recorded failures**, per the source doc's own examples: "denied" and
   "invalidJson." Concretely, for each proxy:

   ```typescript
   // before
   rejects: ({ path, error }: { path: string; error: unknown }): void => {
     handle.calledWith([path]).rejects(error);
   },

   // after — named scenarios, no caller-supplied error
   denied: ({ path }: { path: string }): void => {
     handle.calledWith([path]).rejects(FsErrorStub({ code: 'EACCES', path }));
   },
   ```

   `invalidJson` (for the `read-json-file` family specifically) is a different failure shape — the read
   itself succeeds but `JSON.parse` throws — so it likely needs its own scenario shape rather than
   reusing `FsErrorStub`, since the error there is a `SyntaxError` from `JSON.parse`, not a filesystem
   error code. Build whichever named scenarios each proxy's real failure surface actually needs; "denied"
   and "invalidJson" are the source doc's own examples, not necessarily an exhaustive list for every
   proxy in the family.
4. **Find every current caller of the raw `rejects`/`error: unknown` methods** across the repo and
   switch each to the new named scenario. This is the bulk of the work — a scoped search for
   `.rejects(` calls against each proxy's own name, or simply attempting the delete and letting the
   typecheck find every broken call site, whichever is faster for the executing agent.

## Lint rules this item adds or changes

None. The repo-wide rules that would enforce this shape everywhere (`ban-proxy-catch-all-defaults`,
`ban-proxy-empty-called-with`, `ban-invented-failures`) are built in T05, later in the epic. This item
is a manual, targeted fix of the gateway's own known violations, done early because G16 needed the
`ECONNREFUSED` stub to exist first and G19 is a natural, small follow-on once it does.

## Done when

- [ ] `glob.proxy.ts` has no `calledWith([]).resolves([])` catch-all.
- [ ] Every caller that relied on the glob catch-all now stages its call explicitly.
- [ ] Both `fetchJsonProxy`s (node and browser) offer a named, recorded-failure-backed scenario instead
      of a raw `error: Error` parameter, and every caller is switched.
- [ ] Every `node/fs__promises` proxy that exposed a raw `rejects({ ..., error: unknown })` method now
      offers named, recorded-failure-backed scenarios instead, and every caller is switched.
- [ ] `npm run ward -- -- <files touched>` exits 0.

## Traps

- This item needs G16's `ECONNREFUSED` stub to exist first — check it landed (a stub file under
  `node/net` or wherever G16 placed it, imported from its own file) before starting step 2. If G16 has
  not landed, this item is blocked on it; report that rather than inventing a temporary error shape to
  unblock yourself.
- Deleting a catch-all default is the kind of change that looks safe and then breaks a caller far away
  (a test that never explicitly staged the call it needed, silently relying on the default). Run a
  BROAD ward pass (not just the proxy's own package) after each delete, not only the file-scoped check —
  see EPIC.md's `<dungeonmaster-ward>` guidance on when a wider run earns its cost.
- Do not widen a named scenario's parameter back to accepting an arbitrary `Error` "to keep it flexible"
  — that recreates the exact problem this item exists to remove. If a genuinely new failure shape shows
  up, add a new named method on a new recorded-failure stub (report it under LEFT STANDING if the stub
  itself does not exist yet and building it is out of this item's scope).

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
