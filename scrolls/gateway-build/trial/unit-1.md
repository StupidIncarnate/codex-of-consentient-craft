# Unit 1: settingsPermissionsAddBroker

## Files changed

- `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.ts`
- `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.proxy.ts`
- `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.test.ts`
- `packages/mcp/package.json` — added `"@dungeonmaster/node": "*"` to `dependencies`

No adapter was deleted. `packages/mcp/src/adapters/path/join/path-join-adapter.ts`,
`adapters/fs/read-file/fs-read-file-adapter.ts`, `adapters/fs/write-file/fs-write-file-adapter.ts`
and `adapters/fs/mkdir/fs-mkdir-adapter.ts` are untouched and still have other callers (at least
`install-config-create-responder.ts` for `fsReadFileAdapter`/`fsWriteFileAdapter`, and
`pathJoinAdapter`/`fsMkdirAdapter` elsewhere in the package) — none are orphaned.

## Gateway imports used

- `join` from `@dungeonmaster/node/path`
- `readJsonFileIfExists`, `writeFile`, `ensureDir` from `@dungeonmaster/node/fs/promises`
- Proxy composes `ensureDirProxy`, `readJsonFileIfExistsProxy`, `writeFileProxy` from
  `@dungeonmaster/node/testing`

## The data-loss bug — fixed

`settings-permissions-add-broker.ts:62-67` (old) did:

```ts
try {
  const contents = await fsReadFileAdapter({ filepath: settingsPath });
  existingSettings = JSON.parse(contents);
} catch {
  // File doesn't exist or is invalid JSON - will create new settings
}
```

then wrote the merged result back unconditionally at old line 119 — so a `settings.json` with one
JSON typo, or one this process cannot read, was silently replaced by a file holding only our
permissions, dropping the user's hooks and any other settings.

New code:

```ts
const existingRaw = await readJsonFileIfExists(settingsPath);
const existingSettings: Record<PropertyKey, unknown> =
  existingRaw === null ? {} : (existingRaw as Record<PropertyKey, unknown>);
```

`readJsonFileIfExists` (`packages/node/src/fs/promises/read-json-file-if-exists.ts`) answers `null`
only on ENOENT; everything else — invalid JSON (`readJsonFile` throws
`SyntaxError('Invalid JSON in ' + path)`, naming the file) and EACCES (the raw Node error, which
already names the file/syscall) — rejects, and the broker no longer catches it, so the rejection
reaches the caller and the write is never attempted. Three new tests in the `.test.ts` prove this,
each asserting `writeWasCalled`/`wasWriteCalled` is `false`:

1. missing file → creates settings (existing coverage, still green in isolation)
2. invalid JSON → rejects with `SyntaxError('Invalid JSON in <path>')`, write never called
3. EACCES → rejects with the raw fs error, write never called

## Caller check

Only one caller: `install-config-create-responder.ts:49`, calling `settingsPermissionsAddBroker`
unconditionally, uncaught. Traced the whole chain: `InstallFlow` (no try/catch) →
`start-install.ts` → dynamically imported by `installExecuteBroker`
(`packages/cli/src/brokers/install/execute/install-execute-broker.ts:31-62`), which wraps the
entire `StartInstall` call in `try { … } catch (error) { return { success: false, action: 'failed',
error: errorMessageContract.parse(errorMessage) } }`. So a thrown rejection from this broker already
surfaces as a reported, per-package install failure rather than crashing `dungeonmaster init` —
**no caller change was needed or made.**

## Ward command and result

```
npm run ward -- --only lint,typecheck,unit -- packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.ts packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.proxy.ts packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.test.ts
```

Original result: `typecheck` PASS (549 files). `lint` FAIL (4 errors, all known/reported below).
`unit` FAIL — blocked by the cross-package proxy-hoisting gap below, not by a defect in this
broker's own logic.

## Friction

**Resolved — cross-package hoisting.** `is-proxy-import-guard`/the mock-collector now follows a
`@dungeonmaster/node/testing` import the same way it follows `@dungeonmaster/shared/testing`, so
`ensureDirProxy()`/`readJsonFileIfExistsProxy()`/`writeFileProxy()` composed in this broker's
`.proxy.ts` get their `registerMock` calls hoisted into `jest.mock(...)` for
`@dungeonmaster/node/fs/promises` as expected. All 8 tests in `settings-permissions-add-broker.test.ts`
now pass against the mocks, with no change to the broker, proxy or test bodies described below.

**Resolved — `enforce-proxy-child-creation`.** The rule now follows the gateway import
(`@dungeonmaster/node/fs/promises`) to the names it re-exports, so it recognises the broker's real
import of `readJsonFileIfExists`, `writeFile` and `ensureDir` as satisfying the corresponding proxy
child creations. No code change was needed — this was a rule-side fix.

**Resolved — `ban-primitives` on the proxy's own `settingsDirFor` helper.** Per orchestrator
instruction (this ruling generalizes to every caller proxy that computes a gateway path): the
helper now returns the mcp package's own branded `PathSegment` contract instead of a plain `string`,
built with `PathSegmentStub` the same way `install-config-create-responder.proxy.ts`'s
`claudeSettingsPathFor` already did:

```ts
const settingsDirFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): FilePath =>
  FilePathStub({ value: join(targetProjectRoot, locationsStatics.repoRoot.claude.dir) });
```

`ensureDirProxyHandle.succeeds({ path })` still takes a plain `string` (the gateway's own
known/expected `ban-primitives` misfire, untouched), and a branded `PathSegment` is structurally a
string, so it satisfies that parameter with no cast.

## Final ward result

```
lint:      PASS  1 packages (6 files passed/0 files failed, 6 discovered)  4.3s
typecheck: PASS  1 packages (549 files passed/0 files failed, 549 discovered)  4.7s
unit:      PASS  1 packages (2 files passed/0 files failed, 187 discovered)  9.5s
```

(Run scoped to all six unit-1 + unit-3 files together; see unit-3.md for the same result quoted
against its own file list.)

## Edge cases found the design didn't already account for

- None beyond what `readJsonFileIfExists`/`readJsonFile` already handle — ENOENT, invalid JSON,
  and any other rejection (EACCES, EISDIR, etc.) are exactly the three shapes the trial-plan named,
  and the gateway function already draws the right line between them.
