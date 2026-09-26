# Unit 2: hooks `InstallCreateSettingsResponder`

**Status: GREEN.** Cross-package proxy hoisting is fixed and committed (see Friction below for what
changed and where) — `npm run ward -- --only lint,typecheck,unit` on this unit's files now passes
with no code changes needed beyond what was already written against the fixed behaviour.

## Files changed

- `packages/hooks/src/responders/install/create-settings/install-create-settings-responder.ts`
- `packages/hooks/src/responders/install/create-settings/install-create-settings-responder.proxy.ts`
- `packages/hooks/src/responders/install/create-settings/install-create-settings-responder.test.ts`
- `packages/hooks/package.json` (added `@dungeonmaster/node` to `dependencies`)

## Gateway imports used

- `path` (default) from `@dungeonmaster/node/path`, replacing `pathJoinAdapter`.
- `readJsonFileIfExists`, `writeFileCreatingParent` from `@dungeonmaster/node/fs/promises`, replacing
  `fsReadFileAdapter` + inline `JSON.parse`/`.catch(() => null)`, and `fsEnsureWriteAdapter`.
- Test proxy: `readJsonFileIfExistsProxy`, `writeFileCreatingParentProxy` from `@dungeonmaster/node/testing`.

## The data-loss fix

The old code did `fsReadFileAdapter(...).then((c) => JSON.parse(c)).catch(() => null)`, so a corrupt
`.claude/settings.json` (bad JSON) or a permission-denied read (EACCES) both collapsed to `null`, taking the
same `'created'` branch as a genuinely missing file — silently replacing whatever was really on disk.

The fix: `readJsonFileIfExists` still answers `null` on ENOENT only. Invalid JSON and any other fs error
(EACCES, etc.) reject, and the responder does **not** catch that rejection — it propagates up through
`InstallFlow` → `StartInstall`, straight into `installExecuteBroker`, which already wraps every package's
`StartInstall` in a try/catch and converts an uncaught throw into `{success: false, action: 'failed', error}`
(`packages/cli/src/brokers/install/execute/install-execute-broker.ts:54-61`). So `dungeonmaster init` never
crashes: the hooks package is reported as failed for that one run, every other package's install still runs
(`installOrchestrateBroker` runs sequentially and never stops on one failure), and the error message names the
file — `readJsonFile`'s own `SyntaxError` is `Invalid JSON in <path>` and a real Node fs rejection carries the
path in its own message (e.g. `EACCES: open '<path>'`).

Two new tests prove this:
- `ERROR: {settings.json: invalid JSON} => rejects naming the file, and never writes`
- `ERROR: {settings.json: permission denied} => rejects with the raw EACCES error, and never writes`

Both assert `proxy.getWrittenContent()` is `undefined` — the write proxy's own call record, not just that the
read rejected — so a regression that let the responder reach the write anyway would fail the test even if the
final `await` still rejected.

## Ward command and result

```
npm run ward -- --only lint,typecheck,unit -- packages/hooks/src/responders/install/create-settings/install-create-settings-responder.ts packages/hooks/src/responders/install/create-settings/install-create-settings-responder.proxy.ts packages/hooks/src/responders/install/create-settings/install-create-settings-responder.test.ts packages/hooks/package.json
```

Final re-run, after the gateway-fixes pass landed:

```
lint        @dungeonmaster/hooks PASS  3 files, 3 discovered (4.9s)
typecheck   @dungeonmaster/hooks PASS  489 files, 489 discovered (4.8s)
unit        @dungeonmaster/hooks PASS  1 files, 163 discovered (1.4s)

lint:      PASS  1 packages (3 files passed/0 files failed, 3 discovered)  4.9s
typecheck: PASS  1 packages (489 files passed/0 files failed, 489 discovered)  4.8s
unit:      PASS  1 packages (1 files passed/0 files failed, 163 discovered)  1.4s
```

No code change was needed in this unit's own files to reach this — the fix landed entirely in
`packages/testing/src` (see Friction).

## Friction

**Blocking, cross-cutting, NOT fixable inside this unit's files:** every test in the file fails with
`[io-trap] unstaged fs/promises.readFile(...)` (or `.mkdir(...)`), meaning the `readFile` mock staged by
`readJsonFileIfExistsProxy()` (or `mkdir`/`writeFile` staged by `writeFileCreatingParentProxy()`) never took
effect at runtime — the call fell through to the real io-trap, which throws unconditionally on any unstaged
real I/O.

This is **not specific to this unit**. The same failure, byte-for-byte the same error shape, hits the two
sibling data-loss units that were built concurrently and follow the identical pattern:
- `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.test.ts` (unit 1) — fails
  with `unstaged fs/promises.mkdir("/project/.claude")`.
- `packages/mcp/src/responders/install/config-create/install-config-create-responder.test.ts` (unit 3) — fails
  with `unstaged fs/promises.readFile("/project/.mcp.json")`.

**Confirmed root cause** (traced by a research fork): `packages/testing/src/guards/is-proxy-import/is-proxy-import-guard.ts:13`
— `return importPath.includes('.proxy') || importPath === '@dungeonmaster/shared/testing';` — is the only test the
proxy-mock hoister uses to decide whether to *follow* an import at all. It hardcodes recognition of the one
pre-existing cross-package testing barrel (`@dungeonmaster/shared/testing`) and was never taught about
`@dungeonmaster/node/testing`, the new gateway barrel. So when the hoister
(`typescript-ast-to-proxy-imports-adapter.ts:39` gates on this guard, feeding
`proxy-mock-collector-middleware.ts:65-74`'s recursion) walks this unit's `.proxy.ts` file, its
`import { readJsonFileIfExistsProxy, writeFileCreatingParentProxy } from '@dungeonmaster/node/testing'` is
silently ignored — it never recurses into those two files to find their `registerMock({fn: readFile})` /
`registerMock({fn: mkdir/writeFile})` calls, so **zero** `jest.mock('fs/promises', …)` gets hoisted into the
test file at all. `jest.setup-io-trap.js`'s own blanket `jest.mock('fs/promises', () => globalThis.__ioTrap(name))`
is then the only mock in effect, trapping every `fs/promises` call as unstaged real I/O — confirmed NOT a
merge/clobber bug (`mock-calls-merge-by-module-transformer.ts` correctly unions same-module calls; it's just
never reached, since nothing is collected for this barrel in the first place).

This is not specific to this unit's files. The identical gap breaks every current consumer of
`@dungeonmaster/node/testing` composed from another proxy, confirmed by re-running:
- `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.test.ts` (unit 1) — fails
  with `unstaged fs/promises.mkdir("/project/.claude")`.
- `packages/mcp/src/responders/install/config-create/install-config-create-responder.test.ts` (unit 3) — fails
  with `unstaged fs/promises.readFile("/project/.mcp.json")`.

The fix is a one-line guard change in `packages/testing/src/guards/is-proxy-import/is-proxy-import-guard.ts`
(recognize `@dungeonmaster/node/testing`, or generalize to any `/testing` package-barrel import) — but that
file is outside this unit's lane (hooks + its own `package.json` only), so it is reported here rather than
changed.

**Resolved by the follow-up gateway-fixes pass, in `packages/testing/src`:** `isProxyImportGuard` and
`importPathToFilePathTransformer` generalized past the `@dungeonmaster/shared/testing` special case to a
`(@scope/)?name/testing` pattern, and a new `workspaceRootFindMiddleware` /
`workspacePackageImportResolveMiddleware` / `workspacePackageExportSourceTransformer` chain resolves any
workspace package's own `exports` map (reading each sibling's `package.json`, no hardcoded package name)
instead of the old `require.resolve` + `dist`→source string rewrite, which could never have worked for a
gateway package with no `dist/` at all. This unit's own
`import { readJsonFileIfExistsProxy, writeFileCreatingParentProxy } from '@dungeonmaster/node/testing'` is
one of the two proof cases the orchestrator named for that pass (the other is
`packages/mcp/src/responders/install/config-create/install-config-create-responder.test.ts`, unit 3) — both
now hoist their `registerMock` calls correctly and pass.

**Known, expected lint misfire (per the brief):** `@dungeonmaster/enforce-proxy-child-creation` fired twice on
the proxy file — "Proxy creates readJsonFileIfExistsProxy but install-create-settings-responder.ts does not
import readJsonFileIfExists" and the same for `writeFileCreatingParentProxy`/`writeFileCreatingParent` — even
though the implementation file imports both by name.

**Resolved by the follow-up gateway-fixes pass:** every `@dungeonmaster/node` proxy factory is now named
`<exportName>Proxy` exactly, so `enforce-proxy-child-creation` matches `readJsonFileIfExistsProxy` against
`readJsonFileIfExists` and `writeFileCreatingParentProxy` against `writeFileCreatingParent` directly. Both
misfires are gone; `lint` is clean on this file with no code change on this unit's side.

## Final ward result

```
npm run ward -- --only lint,typecheck,unit -- packages/hooks/src/responders/install/create-settings/install-create-settings-responder.ts packages/hooks/src/responders/install/create-settings/install-create-settings-responder.proxy.ts packages/hooks/src/responders/install/create-settings/install-create-settings-responder.test.ts packages/hooks/package.json

lint:      PASS  1 packages (3 files passed/0 files failed, 3 discovered)  4.9s
typecheck: PASS  1 packages (489 files passed/0 files failed, 489 discovered)  4.8s
unit:      PASS  1 packages (1 files passed/0 files failed, 163 discovered)  1.4s
```

## Edge cases found

- The old code ran `installAgentsSetupBroker` unconditionally, even when the settings read failed (since the
  failure collapsed to `null` before reaching it). The fixed responder now aborts *before*
  `installAgentsSetupBroker` runs when settings.json is unreadable, since the whole install step for this
  package should do nothing when it cannot safely proceed — matches unit 1/3's same choice not to touch other
  side effects once the read has rejected.
