# Unit 3: mcp `install-config-create-responder`

## Files changed

- `packages/mcp/src/responders/install/config-create/install-config-create-responder.ts`
- `packages/mcp/src/responders/install/config-create/install-config-create-responder.proxy.ts`
- `packages/mcp/src/responders/install/config-create/install-config-create-responder.test.ts`

`packages/mcp/package.json` already carried `"@dungeonmaster/node": "*"` in `dependencies` before this
unit started (added by a concurrent agent on another unit) — nothing to add.

## Gateway imports used

- `join` from `@dungeonmaster/node/path` (replaces `pathJoinAdapter`)
- `readJsonFileIfExists`, `writeFile` from `@dungeonmaster/node/fs/promises` (replaces
  `fsReadFileAdapter` + the bare `try { read; JSON.parse } catch {}`, and `fsWriteFileAdapter`)
- Proxy: `readJsonFileIfExistsProxy`, `writeFileProxy` from `@dungeonmaster/node/testing`

`settingsPermissionsAddBroker`/`agentsPluginCreateBroker` calls, and their proxies, are untouched —
per the trial plan, unit 1 owns that broker's own gateway migration.

## The data-loss fix

Old code: `try { contents = await fsReadFileAdapter(...); existingConfig = JSON.parse(contents); }
catch { /* File doesn't exist or is invalid JSON - will create new config */ }` — ENOENT, EACCES and
invalid JSON all fell into the same branch, and the code below then wrote a fresh `.mcp.json`
containing only the dungeonmaster server, discarding every other configured MCP server.

New code: `const existingConfig = (await readJsonFileIfExists(configPath)) as McpConfig | null;` — no
`try/catch`. `readJsonFileIfExists` itself answers `null` only on ENOENT; invalid JSON (a
`SyntaxError` naming the path, e.g. `Invalid JSON in /project/.mcp.json`) and EACCES (Node's own
`ErrnoException`, whose message already names the path, e.g. `EACCES: open '/project/.mcp.json'`)
reject and propagate out of the responder uncaught. `InstallFlow` is a pure pass-through, so the
rejection reaches `installExecuteBroker` (`packages/cli/src/brokers/install/execute/`), which already
wraps every package's `StartInstall` call in a `try/catch` and turns a thrown error into
`{success: false, action: 'failed', error: <message>}` — so `dungeonmaster init` reports the failure
instead of crashing, with no change needed on the CLI side. This mirrors the pattern the codebase
already uses elsewhere for refusals (`quest-work` responders throw rather than return
`{success: false}`).

One deliberate ordering change: the old code called `settingsPermissionsAddBroker` /
`agentsPluginCreateBroker` unconditionally, even when the read/parse silently "succeeded" as
`existingConfig = null`. Now, since the rejection happens on the `readJsonFileIfExists` line itself —
before those two broker calls — a corrupt/unreadable `.mcp.json` means neither broker runs. The whole
install step is reported as one failure rather than "permissions added, but the also-broken
`.mcp.json` step silently succeeded as a fresh overwrite." Tests for the corrupt/EACCES cases
therefore stage only the read (no settings/agents/write staging), so a regression that made the
responder reach past the corrupt read would throw an "unstaged mock" error rather than silently
passing.

## Ward command and result

```
npm run ward -- --only lint,typecheck,unit -- packages/mcp/src/responders/install/config-create/install-config-create-responder.ts packages/mcp/src/responders/install/config-create/install-config-create-responder.proxy.ts packages/mcp/src/responders/install/config-create/install-config-create-responder.test.ts
```

Original result:

```
lint:      FAIL  1 packages (2 files passed/1 files failed, 3 discovered)  @dungeonmaster/mcp (3)
typecheck: PASS  1 packages (549 files passed/0 files failed, 549 discovered)
unit:      FAIL  1 packages (0 files passed/1 files failed, 187 discovered)  @dungeonmaster/mcp (5)
```

## Friction

**Resolved — `enforce-proxy-child-creation`.** The rule now resolves a gateway barrel import
(`@dungeonmaster/node/fs/promises`) to the names it re-exports, so it recognises the responder's
real import of `readJsonFileIfExists`/`writeFile` as satisfying
`readJsonFileIfExistsProxy`/`writeFileProxy`'s child creation. No code change needed — a rule-side
fix.

**Resolved — `ban-primitives` on `install-config-create-responder.proxy.ts:56`.** Per orchestrator
instruction (the same ruling applied in unit 1): `configPathFor` now returns the mcp package's own
branded `PathSegment` contract, built with `PathSegmentStub`, instead of a plain `string` — matching
the pattern `claudeSettingsPathFor` right below it already used:

```ts
const configPathFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): PathSegment =>
  PathSegmentStub({ value: join(targetProjectRoot, locationsStatics.repoRoot.mcpJson) });
```

`readJsonFileIfExistsProxy`/`writeFileProxy`'s own `path: string` parameters are untouched (the
gateway's own known/expected `ban-primitives` misfire) — a branded `PathSegment` is structurally a
string and satisfies them with no cast.

**Resolved — cross-package hoisting.** The mock-collector (`import-path-to-file-path-transformer.ts`)
now follows a `@dungeonmaster/node/testing` import the same way it already followed
`@dungeonmaster/shared/testing`, so the `registerMock({fn: readFile})` / `registerMock({fn:
writeFile})` calls inside `readJsonFileIfExistsProxy`/`writeFileProxy` get discovered and hoisted
into `jest.mock('fs/promises', ...)` for this test file. All 5 tests in
`install-config-create-responder.test.ts` now pass against the mocks, with no change to the
responder, proxy or test bodies described above. The same fix resolves the identical failure
previously reproduced in unit 1
(`settings-permissions-add-broker.test.ts`) and unit 2
(`install-create-settings-responder.test.ts`) — confirmed systemic, not specific to this file.

## Final ward result

```
lint:      PASS  1 packages (6 files passed/0 files failed, 6 discovered)  4.3s
typecheck: PASS  1 packages (549 files passed/0 files failed, 549 discovered)  4.7s
unit:      PASS  1 packages (2 files passed/0 files failed, 187 discovered)  9.5s
```

(Run scoped to all six unit-1 + unit-3 files together; see unit-1.md for the same result.)

## Edge cases found the gateway design didn't account for

1. **The mock-collector's relative-imports-only rule, described above** — every trial unit that
   composes a gateway `/testing` proxy from a package-local `.proxy.ts` needs this fixed before its
   `unit` check can go green; it is not particular to `.mcp.json` or to this responder.
2. **Ordering interaction with the still-unmigrated `settingsPermissionsAddBroker` call**: fixing the
   data-loss bug by letting the read throw means that call (and `agentsPluginCreateBroker`) no longer
   run when `.mcp.json` is corrupt/unreadable, where before they always ran regardless of the
   `.mcp.json` read's outcome. Worth the two units' authors confirming this is the intended combined
   behaviour once both land (I believe it is — see "The data-loss fix" above).
