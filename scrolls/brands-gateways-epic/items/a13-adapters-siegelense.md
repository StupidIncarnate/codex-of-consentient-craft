# A13: Adapters: `siegelense`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" table rows 4-6 (335-337) and item 33's `currentBranch` half (768-780); `scrolls/gateway-build/coverage.md` and `stays-as-adapter.md` siegelense rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | siegelense |
| Checks to run | lint, typecheck, unit |
| Split | operator splits, 2 to 4 files per agent (grouped by domain below) |
| Runs alone | no other agent editing `siegelense` at the same time |

## Current state

Census of `packages/siegelense/src/adapters/**` run 2026-09-26: 49 files. Two groups this item does NOT touch:

- `dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts` — [A02](a02-forwarder-adapters.md)'s job
  (forwards into `@dungeonmaster/config`, not an outside call).
- `git/branch-read/git-branch-read-adapter.ts` — [A01](a01-dead-adapters.md) deletes it as dead code. Confirmed
  2026-09-26 that item 33's own migration already happened: `instance-reserve-broker.ts` already imports
  `currentBranch` from `#gateway/bin/git` directly (its own header even documents the `isGitNotARepositoryErrorGuard`
  reconciliation item 33 calls for). The adapter is simply the leftover, now-orphaned old code — do not re-migrate
  a caller that has already moved.

That leaves 47 adapters, grouped by domain:

**`fs/*` (16 files) — all `gateway` fate, all straightforward `@dungeonmaster/node/fs` or `fs/promises` swaps:**
`append-file` → `appendFile`; `close-fd` → `closeSync`; `copy-file` → `copyFile`; `cp` → `copyDirContents`;
`open-fd` → `openForAppendSync`; `read-file` → `readFile`; `readdir` → `readdirIfExists`; `readlink` →
`readlinkIfLink`; `realpath` → `realpath`; `rename` → `rename`; `rm` → `rm`; `stat` → `statIfExists`; `statfs` →
`diskFreeBytes`; `symlink` → `symlink`; `unlink` → `unlink`; `write-file` → `writeFile`.

**Misc singles (gateway/split, 18 files):**

| Path | Replacement |
|---|---|
| `async/delay/async-delay-adapter.ts` | gateway → `@dungeonmaster/node/setTimeout` (wraps it as an awaitable promise) |
| `child-process/spawn-detached/child-process-spawn-detached-adapter.ts` | gateway → `@dungeonmaster/node/child_process` `spawnDetached` |
| `cli-package/bin-resolve/cli-package-bin-resolve-adapter.ts` | split → `@dungeonmaster/node/fs` `existsSync`, `readFileSync`; the composed bin-path logic stays with `siegelense` |
| `cli-package/bin-resolve/package-root-find-layer-adapter.ts` | gateway → `@dungeonmaster/node/fs` `findUpSync` |
| `crypto/hash/crypto-hash-adapter.ts` | gateway → `@dungeonmaster/node/crypto` (`createHash`) — output validated with a zod brand at the call site, not in the gateway |
| `error/is-native-error/error-is-native-error-adapter.ts` | gateway → `@dungeonmaster/node/util/types` `isNativeError` |
| `fetch/http-request/fetch-http-request-adapter.ts` | gateway → `@dungeonmaster/node/fetch` `fetchJson` |
| `fetch/probe/fetch-probe-adapter.ts` | gateway → `@dungeonmaster/node/fetch` `fetchOk`; the cross-realm `isNativeError` check moves in unchanged |
| `net/unix-request/net-unix-request-adapter.ts` | gateway → `@dungeonmaster/node/net` `unixSocketRequest`; contract parsing moves to the caller |
| `net/unix-serve/net-unix-serve-adapter.ts` | gateway → `@dungeonmaster/node/net` `unixSocketServe`; contract parsing moves to the caller |
| `npm/install/npm-install-adapter.ts` | gateway → `@dungeonmaster/bin/npm` `install` |
| `npm/run-build/npm-run-build-adapter.ts` | gateway → `@dungeonmaster/bin/npm` `runBuild` |
| `os/info/os-info-adapter.ts` | split → `@dungeonmaster/node/os` (`cpus`/`freemem`/`loadavg`/`totalmem`); the MB conversion stays a `siegelense` broker |
| `os/tmpdir/os-tmpdir-adapter.ts` | gateway → `@dungeonmaster/node/os` (`tmpdir`) |
| `pixelmatch/compare/pixelmatch-compare-adapter.ts` | gateway → `@dungeonmaster/npm/pixelmatch` — deliberately no `catch` (its own header says so), kept verbatim |
| `pngjs/decode/pngjs-decode-adapter.ts` | gateway → `@dungeonmaster/npm/pngjs` `decodePng` |
| `process/is-alive/process-is-alive-adapter.ts` | gateway → `@dungeonmaster/node/process` `kill`; the ESRCH classification is our logic and stays a `siegelense` broker |
| `process/kill-group/process-kill-group-adapter.ts` | gateway → `@dungeonmaster/node/process` `kill`; same note |

**`playwright/session/*` (13 files) — the trickiest group, per GW rows 335-337:**

| Path | Fate |
|---|---|
| `dom-read-layer-adapter.ts` | stays → a `siegelense` transformer/statics: pure page-side JS source-string builder, plus our own contract translation of the returned value; no library call |
| `key-press-layer-adapter.ts` | stays → same shape |
| `key-read-layer-adapter.ts` | stays → same shape |
| `root-check-layer-adapter.ts` | stays → same shape |
| `listeners-layer-adapter.ts` | stays → a `siegelense` transformer; formats readings it already collected, imports nothing from `@playwright/test` by design (its own header says so) |
| `paste-layer-adapter.ts` | split → the source-STRING content (referencing `document`, clipboard globals) runs inside the remote browser and is exempt from the gateway rule by the lint carve-out [A19](a19-adapters-folder-type-gone-caller-rules-on.md) builds; but the OUTER `page.evaluate(source)` call that RUNS it is a real `@playwright/test` call in THIS process and moves to `#gateway/npm/playwright__test` |
| `storage-read-layer-adapter.ts` | split → same shape as `paste-layer-adapter.ts` |
| `init-script-add-layer-adapter.ts` | split → the real `Page.addInitScript` call moves to `#gateway/npm/playwright__test`; the `ContentText`/`AdapterResult` translation stays |
| `settle-wait-layer-adapter.ts` | split → same shape (real `Page` method call moves, translation stays) |
| `viewport-set-layer-adapter.ts` | split → same shape (`Page.setViewportSize`) |
| `playwright-session-adapter.ts` | split → `chromium.launch`/`browser.newContext`/`page.on`/`page.evaluate`/`page.waitForTimeout` move to `#gateway/npm/playwright__test`; the `BrowserSession` facade, the ref registry and the settle detector are almost entirely our own logic and stay |
| `ref-registry-layer-adapter.ts` | split → same shape as `playwright-session-adapter.ts` |
| `settle-poll-layer-adapter.ts` | split → same shape |

**The `page.evaluate` split is the one requiring the most care.** GW's own words: "The strings become siegelense
statics or transformers. The `page.evaluate` call goes through `#gateway/npm/playwright__test`." Every one of the
four "stays" adapters above (`dom-read`, `key-press`, `key-read`, `root-check`) builds a JS source string as a
plain template literal and returns it to `playwright-session-adapter.ts`, which is the ONE file that actually
calls `page.evaluate(source)` — confirmed by each "stays" file's own header ("the `page.evaluate(source)` call
that actually runs it lives in `playwright-session-adapter.ts`, not here"). So the split is: the four builders move
to `transformers/`/`statics/` unchanged (they make no outside call at all), and `playwright-session-adapter.ts`'s
own `page.evaluate` calls move onto the gateway's `@playwright/test` wrapper.

## Work

1. For every `fs/*` and "misc single" row: switch every caller to the named export, imported from its
   `#gateway/<kind>/<subpath>` path.
2. For every `playwright/session/*` "stays" row: move the file into `transformers/` or `statics/` (whichever fits
   what it does — a pure string builder taking no state is a transformer; a fixed template with no input is
   statics), keeping its exact string output unchanged. Update `playwright-session-adapter.ts`'s import
   accordingly.
3. For every `playwright/session/*` "split" row: move the real `@playwright/test` call onto
   `#gateway/npm/playwright__test`; keep the our-logic half (translation, facade, ref registry, settle detection)
   as a broker in `siegelense`.
4. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file (e.g. `#gateway/npm/playwright__test/playwright__test.proxy`), never through a barrel, per T1/T3.
5. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
6. Delete every adapter this item touches, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty
   wrapper folder.
7. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 47 adapter files remain, and — once [A01](a01-dead-adapters.md) and
  [A02](a02-forwarder-adapters.md)'s siegelense work has also landed — `packages/siegelense/src/adapters/` is gone
  entirely.
- `npm run ward -- --only lint,typecheck,unit -- packages/siegelense` exits 0.

## Traps

- Confirm A01 (git-branch-read) and A02 (config-resolve) have landed before you start.
- The `page.evaluate` carve-out in `platform-globals-ban` (a global used inside a string that runs in the browser,
  not in this process) is [A19](a19-adapters-folder-type-gone-caller-rules-on.md)'s job to build into the lint
  rule, not this item's. This item only moves the CALL that invokes `page.evaluate`; it does not need the lint
  carve-out to exist yet to do that move correctly.
- Do not confuse `pixelmatch-compare-adapter.ts`'s deliberate lack of a `catch` with a bug to fix — its own header
  says this is intentional, and the migration should keep it that way.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
