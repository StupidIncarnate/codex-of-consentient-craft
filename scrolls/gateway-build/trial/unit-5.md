# Unit 5: tooling `duplicate-detection-detect-broker`

## Files changed

- `packages/tooling/src/brokers/duplicate-detection/detect/duplicate-detection-detect-broker.ts`
- `packages/tooling/src/brokers/duplicate-detection/detect/duplicate-detection-detect-broker.proxy.ts`
- `packages/tooling/src/brokers/duplicate-detection/detect/duplicate-detection-detect-broker.test.ts`
- `packages/tooling/src/statics/glob-ignore/glob-ignore-statics.ts` (new)
- `packages/tooling/src/statics/glob-ignore/glob-ignore-statics.test.ts` (new)
- `packages/tooling/package.json` — added `"@dungeonmaster/node": "*"` and `"@dungeonmaster/npm": "*"` to `dependencies`

`packages/tooling/src/adapters/glob/find/glob-find-adapter.ts` and
`packages/tooling/src/adapters/fs/read-file/fs-read-file-adapter.ts` (plus their `.proxy.ts`) are
untouched and now have no callers — left in place per the trial README.

## Gateway imports used

- `glob` from `@dungeonmaster/npm/glob` (replaces `globFindAdapter`)
- `readFile` from `@dungeonmaster/node/fs/promises` (replaces `fsReadFileAdapter`)
- Proxy: `globProxy` from `@dungeonmaster/npm/testing`, `readFileProxy` from `@dungeonmaster/node/testing`

## The glob drift, resolved

`globFindAdapter` (`glob-find-adapter.ts:20-24`) hard-codes
`ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']` and never sets `nodir`,
so it inherits the raw `glob` package's own default, `nodir: false` — **directories are included**.
The gateway `glob` (`packages/npm/src/glob/glob.ts:26`) makes `nodir: true` (directories excluded)
the default and takes `ignore` as a **required** argument with no baked-in list.

To keep this caller's behaviour byte-identical, the broker now passes both explicitly:
`nodir: false` and `ignore: globIgnoreStatics.defaults` — the same four patterns, moved out of the
deleted call site into `packages/tooling/src/statics/glob-ignore/glob-ignore-statics.ts` (no existing
tooling statics file held an ignore list, so this is new).

**Whether directories mattered here:** they never could have, in practice. The broker's only
consumer of `filePaths` is a `readFile` per match, and every call site's `pattern` is a `**/*.ts`-style
glob — a directory only matches that if a directory happened to be *named* `something.ts`, which does
not occur in this repo. So `nodir: false` (today's real behaviour) and `nodir: true` (the gateway's
default) are observationally identical for every caller of this broker today; `nodir: false` is kept
anyway so the switch is provably behaviour-preserving rather than "probably fine because directories
never appear."

## The pass-through that disappears

`fsReadFileAdapter` (`fs-read-file-adapter.ts:13-20`) was one `readFile` call plus one
`sourceCodeContract.parse` — nothing else. It is gone from the broker's own code path; the broker now
calls `readFile` from the gateway directly and does the `sourceCodeContract.parse` itself
(`duplicate-detection-detect-broker.ts:53-54`).

## Error shape — unchanged

Old `fsReadFileAdapter` had no `try/catch`: `readFile(filePath, 'utf8')` rejects with Node's raw
`ErrnoException` straight through to the broker, which also has no `try/catch` around the call — so a
missing/unreadable file already surfaced as a raw, unwrapped rejection to whatever calls the broker.
The gateway's `readFile` (`packages/node/src/fs/promises/read-file.ts:14`) is the same: one line,
`fsReadFile(path, 'utf8')`, no wrapping, no `cause`. So this caller never relied on any wrapped/`cause`
error shape from the old adapter — both today and after the switch, a read failure is Node's own
`ErrnoException`, unmodified. (The gateway's `glob`, unlike `readFile`, DOES wrap its npm call's
rejection in a new `Error` with `cause` — see `glob.ts:29-34` — a difference this unit's tests do not
exercise since none of them stage a glob failure, but worth flagging for whoever reads glob rejections
elsewhere.)

## Ward command and result

```
npm run ward -- --only lint,typecheck,unit -- packages/tooling/src/brokers/duplicate-detection/detect/duplicate-detection-detect-broker.ts packages/tooling/src/brokers/duplicate-detection/detect/duplicate-detection-detect-broker.proxy.ts packages/tooling/src/brokers/duplicate-detection/detect/duplicate-detection-detect-broker.test.ts packages/tooling/src/statics/glob-ignore/glob-ignore-statics.ts packages/tooling/src/statics/glob-ignore/glob-ignore-statics.test.ts
```

```
lint:      PASS  1 packages (5 files passed/0 files failed, 5 discovered)  4.0s
typecheck: PASS  1 packages (79 files passed/0 files failed, 79 discovered)  3.2s
unit:      PASS  1 packages (4 files passed/0 files failed, 25 discovered)  2.1s
```

An earlier run without the statics file's own test failed
`@dungeonmaster/enforce-implementation-colocation` ("Create glob-ignore-statics.test.ts") — fixed by
adding that test, shown above as part of the final green run.

## Friction

**None of the import-boundary or proxy-hoisting friction the trial plan predicted for this unit
occurred.** The trial plan flagged two risks for units 4/5/6/9/10: (a) a `brokers/`/`responders/`
file importing `@dungeonmaster/node`/`@dungeonmaster/npm` directly tripping an import-boundary rule
that used to restrict `node_modules` imports to `adapters/`, and (b) the cross-package proxy-hoisting
gap that blocked unit 3's (and units 1/2's) `unit` check. Per this unit's briefing, both are already
fixed on this tree — confirmed here: lint raised nothing about the `brokers/` file importing
`@dungeonmaster/npm/glob` or `@dungeonmaster/node/fs/promises`, and the `unit` check passed on the
first green run once the statics test existed, with no `[io-trap] unstaged` failures.

**One real lint hit, already fixed:** `@dungeonmaster/enforce-implementation-colocation` on the new
`glob-ignore-statics.ts` for lacking a colocated test — not a gateway misfire, a genuine missing file,
fixed by adding `glob-ignore-statics.test.ts`.

`packages/tooling/package.json` itself showed up in the FIRST lint run as "File ignored because no
matching configuration was supplied" — not an error, ESLint's own note that it has no config for JSON;
harmless and gone from the final scoped run since that run didn't re-list the file as a target for a
specific check (ward still typechecked/unit-tested the package as a whole).

## Edge cases found the gateway design didn't account for

1. **`nodir` default flip is a real, silent behaviour change for any caller that didn't already
   filter directories out of its glob result.** This caller never noticed because its pattern shape
   made the omission unobservable — but a caller matching a broader pattern (`**/*` rather than
   `**/*.ts`) against a real tree WOULD start receiving directory entries it used to get for free.
   Nothing in the gateway's own file flags this as a decision point for a caller migrating in — it's
   only visible by diffing the old adapter's options object against the new default, which is exactly
   what the trial plan asked this unit to do.
2. **No tooling-package precedent for an ignore-list static before this unit.** `glob-ignore-statics.ts`
   is new; the pattern (a plain readonly array of glob strings, no branding) matches
   `duplicate-detection-statics.ts`'s style but nothing else in tooling held a list shaped like this,
   so there was no existing file to extend.
