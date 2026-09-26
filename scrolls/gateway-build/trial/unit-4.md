# Unit 4: config `install-create-config-responder`

## Files changed

- `packages/config/src/responders/install/create-config/install-create-config-responder.ts`
- `packages/config/src/responders/install/create-config/install-create-config-responder.proxy.ts`
- `packages/config/src/responders/install/create-config/install-create-config-responder.test.ts`
- `packages/config/package.json` — added `"@dungeonmaster/node": "*"` to `dependencies`

## Gateway imports used

- `join` from `@dungeonmaster/node/path` (replaces `pathJoinAdapter`)
- `pathExists`, `readJsonFileIfExists`, `writeFile` from `@dungeonmaster/node/fs/promises`
  (replaces `fsAccessAdapter`, `fsReadFileAdapter` + the bare `.then(JSON.parse).catch(() => null)`,
  and `fsWriteFileAdapter`)
- Proxy: `pathExistsProxy`, `readJsonFileIfExistsProxy`, `writeFileProxy` from
  `@dungeonmaster/node/testing`
- Test: `FsErrorStub` from `@dungeonmaster/node/fs/promises`, to stage the EACCES case

## The behaviour decision

This responder was already the control case — `access().catch(() => false)` then a read-parse
`.catch(() => null)` that reports "not valid JSON" and skips the write, never a data-loss bug like
units 1-3. The question was whether the gateway swap should stay byte-identical or make the
now-available distinction explicit.

I read `installExecuteBroker` (`packages/cli/src/brokers/install/execute/install-execute-broker.ts:52-53`):
`const result = await startInstallFn({ context }); return installResultContract.parse(result);` — a
`StartInstall` result of any shape the contract accepts passes straight through; the broker only
builds its own `{success: false, action: 'failed'}` when the whole call **throws**. So a responder
can report a soft "skipped, and here is why" via a `success: true` result with an `error` field —
that field is optional on `installResultContract` and is not treated as a failure signal by anything
downstream.

Given that, I kept the "careful" behaviour (skip the write, `success: true`, `action: 'skipped'`) for
every read failure — this is not a data-loss bug, so there is nothing to escalate to a thrown
failure — but split what was one generic "not valid JSON" message into three real cases:

1. **Missing** (`pathExists` false, or the file vanishes between the exists check and the read):
   unchanged — falls through to "create fresh," same as before.
2. **Corrupt** (`readJsonFileIfExists` rejects with a `SyntaxError`, from `readJsonFile`'s own
   `JSON.parse` catch): `message` says "is not valid JSON", `error` carries the real
   `SyntaxError` text (`Invalid JSON in <path>`).
3. **Unreadable** (`readJsonFileIfExists` rejects with anything else — EACCES, etc.): `message`
   says "could not be read" instead of the previous, inaccurate "not valid JSON" wording, `error`
   carries the real `NodeJS.ErrnoException` message.

The old code could not make this distinction because `fsReadFileAdapter`'s catch collapsed EACCES,
ENOTDIR-on-read and invalid JSON into the same `null`. `readJsonFileIfExists` only folds ENOENT into
`null`; everything else rejects, so the distinction was mechanically available and I surfaced it
through `message` (the human-facing reason) and the new `error` field (the underlying message),
rather than silently reusing one generic string for two different facts.

## Ward command and result

```
npm run ward -- --only lint,typecheck,unit -- packages/config/src/responders/install/create-config/install-create-config-responder.ts packages/config/src/responders/install/create-config/install-create-config-responder.proxy.ts packages/config/src/responders/install/create-config/install-create-config-responder.test.ts
```

```
lint:      PASS  1 packages (3 files passed/0 files failed, 3 discovered)  4.0s
typecheck: PASS  1 packages (104 files passed/0 files failed, 104 discovered)  3.3s
unit:      PASS  1 packages (1 files passed/0 files failed, 39 discovered)  1.3s
```

(First pass hit two real bugs in my own code, both fixed before the run above: an unused
`FileContentsStub` import left over from the old proxy, and `@typescript-eslint/init-declarations` /
`no-useless-assignment` disagreeing over a `let parsedExisting: unknown` mutated inside a
`try`/`catch` — resolved by replacing the `try`/`catch` with a `.then(onFulfilled, onRejected)` pair
that returns a `{ok, value}` / `{ok, error}` result object instead of mutating an outer `let`.)

## Friction

**None that reached the reported cases.** No lint rule fired on the gateway imports themselves — no
`enforce-proxy-child-creation` phantom-proxy misfire (unit 3 hit this on the same
`readJsonFileIfExistsProxy`/`writeFileProxy` pair), no `ban-primitives` misfire on the proxy's plain
`{path: string}` params, and no cross-folder-import violation for a `responders/` file importing
`@dungeonmaster/node/*` directly, which the trial plan predicted as untaught. All three of these
appear to already be fixed in this tree, matching the "systemic gaps found by earlier units are FIXED"
note in the brief.

**Unit ran clean on the first real attempt** — the cross-package `/testing` proxy hoisting gap unit 3
hit (a package-local `.proxy.ts` composing `@dungeonmaster/node/testing` proxies never got its mocks
applied, so the real `fs/promises` ran and the I/O trap failed every test) is also gone: every test
using `pathExistsProxy`/`readJsonFileIfExistsProxy`/`writeFileProxy` from `@dungeonmaster/node/testing`
passed on the first try.

## Edge cases found the gateway design didn't account for

None beyond what the trial plan already named. The one true edge case — `readJsonFileIfExists`
answering `null` after `pathExists` already confirmed the file was there (a delete-between-calls
race) — was not previously reachable at all (the old code read once and either had content or
`null` from any failure), so there was nothing to regress; I documented the decision inline (fall
through to "create fresh," same as a real missing file) rather than adding a distinct return branch,
since a config that disappeared out from under the read has nothing left to protect.
