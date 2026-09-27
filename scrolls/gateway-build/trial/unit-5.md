# Unit 5: tooling `duplicate-detection-detect-broker`

`scrolls/gateway-build/README.md` section 5 (Trial 1, row 5) covers the outcome. This caller's own
four-pattern ignore list moved into `packages/tooling/src/statics/glob-ignore/glob-ignore-statics.ts`.
The broker now passes that list, plus `nodir: false`, to the gateway's `glob` explicitly.

## Two `glob`/`readFile` behaviours a future caller needs to know

The gateway's `glob` excludes directories by default. `glob`
(`packages/@gateway/npm/src/glob/glob.ts`) defaults its `nodir` option to `true`, so a result leaves
out every directory unless a caller passes `nodir: false`. `glob` also requires an `ignore` argument,
with no patterns built in. The adapter this caller replaced defaulted to `nodir: false` (directories
included) and had a fixed ignore list hard-coded inside it. A caller switching onto the gateway `glob`
must choose both values itself; the gateway does not warn about the change from an old adapter's
defaults.

`glob` wraps a rejection; `readFile` does not. Gateway `readFile`
(`packages/@gateway/node/src/fs/promises/read-file.ts`) passes through Node's raw `ErrnoException`
unchanged, with no wrapping. Gateway `glob` catches a rejection from the real `glob` package and
re-throws it wrapped in a new `Error`, with the original error set as `cause`. A caller reading a
`glob` rejection should expect this wrapped shape, not a raw one.
