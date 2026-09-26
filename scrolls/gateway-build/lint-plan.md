# Gateway lint plan

Research only. No code changed. Written against the brief's rules (brief overrides the design doc
where they differ), read in full, plus `scrolls/adapters-to-one-place.md`'s "Our lint rules skip the
gateway as a whole", the gateway rule-set draft under "Tests", and Defaults items 7 and 9.

**Ground truth checked against the live tree, not just the doc:** `packages/npm`, `packages/node`,
`packages/browser`, `packages/bin` already exist (scaffolded by another agent right now) with **no
`src/` directory** — `packages/node/path/index.ts`, `packages/node/fs/index.ts` sit directly under the
package root. Root `package.json` name is `"dungeonmaster"` (unscoped); every workspace package is
already namespaced `@dungeonmaster/*`, so the existing convention this repo uses IS the doc's
"unscoped root → build a scope from the name" rule, already applied. `packages/npm/package.json` and
`packages/node/package.json` confirm the `exports` map the doc describes: `./react`, `./fs`, …, each
with a `source`/`require`/`import`/`types` quad, no root `.` export.

This absence of `src/` is the single fact that breaks the most existing rules, because five of them
resolve "is this even a checkable file, and what folder type is it" by requiring a literal `/src/`
segment in the path. Every table below says which.

## 1. How the shipped config is built, and where the carve-out goes

`configDungeonmasterBroker` (`packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`)
returns `{ typescript, test, fileOverrides, ruleEnforceOn }`. The root `eslint.config.js` consumes it
in two blocks:

| Block | `eslint.config.js:line` | Files glob | Rules |
|---|---|---|---|
| Implementation | `:80-125` | `**/*.ts, **/*.tsx, **/*.js` | `dungeonmasterConfigs.typescript.rules` (built at `config-dungeonmaster-broker.ts:169-178`, the `dungeonmasterCustomRules` object at `:72-167`) |
| Test | `:129-171` | `**/*.test.ts, **/*.spec.ts, **/*.harness.ts, **/tests/**/*.ts` | `dungeonmasterTestConfigs.test.rules` (built at `config-dungeonmaster-broker.ts:180-201`, same `dungeonmasterCustomRules` object) |
| File overrides | `:127`, `:173` | per-override globs | `dungeonmasterConfigs.fileOverrides` / `...TestConfigs.fileOverrides` (built at `config-dungeonmaster-broker.ts:204-329`) |

Both the implementation and test rule sets are built from **one shared object**,
`dungeonmasterCustomRules` (`config-dungeonmaster-broker.ts:72-167`), spread into both `typescriptConfig`
(`:174-178`) and `testConfig` (`:186-191`). That is exactly the "every rule we have now, and every rule
we add later" the design doc means — a rule added to `dungeonmasterCustomRules` lands in both blocks
with no second edit, which is why the carve-out has to sit at the config layer, not inside each rule.

**Is a path-scoped rule set "disabling," in the user's sense?** No, if built as the doc's own
two-config split does it: **the carve-out is a second, ADDITIVE config entry that changes which files a
glob matches, never a `rules: {…: 'off'}` entry and never an `eslint-disable` comment.** The user's
constraint is about not turning a rule off to dodge a real violation; scoping ESLint's flat-config
`files`/`ignores` is the mechanism ESLint itself gives for "this rule set doesn't apply to this kind of
file" (exactly how the existing `proxyOverrides`, `stubOverride`, `e2eOverrides`, etc. already work at
`config-dungeonmaster-broker.ts:204-329` — none of those are "disabling", they are re-scoping). The
difference that matters: those existing overrides turn OFF one or two rules for one file kind and leave
a comment saying why; the gateway carve-out must instead swap in a **positive, gateway-specific rule
set**, so nothing is silently "off" with no replacement — every rule that would have applied to a
non-gateway file either still applies (unchanged) or is replaced by a gateway rule enforcing the
equivalent gateway-shaped rule (test+proxy colocation, no silent catch, file header, …). That
replacement is what makes it "not disabling."

**One place, driven from shared statics, not a glob copied into every rule.** Add a `gatewayPackages`
(or reuse/extend `locationsStatics`) entry in `@dungeonmaster/shared/statics` naming the four folders:

```ts
// packages/shared/src/statics/locations/locations-statics.ts (or a new gateway-locations-statics.ts)
export const gatewayLocationsStatics = {
  packageGlobs: ['packages/npm/**', 'packages/node/**', 'packages/browser/**', 'packages/bin/**'],
} as const;
```

`configDungeonmasterBroker` already imports `@dungeonmaster/shared/statics` at module load
(`config-dungeonmaster-broker.ts:19`, for `dungeonmasterRuleEnforceOnStatics`), so importing this new
static costs nothing new. `eslint.config.js` then does exactly what the doc sketches at
`scrolls/adapters-to-one-place.md:373-379`:

```js
// eslint.config.js — implementation block gains an ignores line built from the static, never a
// hand-copied glob list
{
  files: ['**/*.ts', '**/*.tsx', '**/*.js'],
  ignores: [...existingIgnores, ...gatewayLocationsStatics.packageGlobs],
  rules: { ...dungeonmasterConfigs.typescript.rules, ... },
},
// a new block, built the same way the doc's gateway-rules table below assembles it
{
  files: gatewayLocationsStatics.packageGlobs,
  rules: { ...gatewayRules },
},
```

The test block (`eslint.config.js:129-171`) is **not** carved out — the doc says so explicitly
("Its tests still get the test preset"), and it already applies by file suffix (`**/*.test.ts`, …),
not by package path, so a gateway `read-file-if-exists.test.ts` already gets the test preset with zero
change.

**Keep every rule that still makes sense in the gateway on.** Section 2 shows that several of these
—the file header rule, colocation, proxy patterns— currently **silently skip** gateway files today
because they gate on `/src/`, independent of any carve-out. That has to be fixed at the rule (guard)
level, in section 2, or "kept on" is a no-op.

## 2. Existing rules that misfire on gateway files or on callers

| # | Rule (`path:line`) | On a gateway file | On a caller importing `@dungeonmaster/node/fs` | Clean adjustment |
|---|---|---|---|---|
| 1 | `enforce-project-structure` — `packages/eslint-plugin/src/brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker.ts:86` calls `shouldExcludeFileFromProjectStructureRulesGuard({filename})`, which at `should-exclude-file-from-project-structure-rules-guard.ts:44-48` returns `true` (exclude) whenever `!filename.includes('/src/') && !filename.startsWith('src/')` | Already self-skips (no `/src/` in `packages/node/fs/read-file-if-exists.ts`) — no adjustment needed; this is the ONE case where the doc's "Not applied: folder-type structure" is already true for free | No effect (caller files still have `/src/`, unchanged) | None — leave as is. The carve-out ignore glob is still worth adding for defense-in-depth (if the guard's logic ever changes), but is not load-bearing here. |
| 2 | `enforce-file-metadata` — `rule-enforce-file-metadata-broker.ts:38` calls the SAME `shouldExcludeFileFromProjectStructureRulesGuard` | **False negative**: the file-header rule silently never fires on any gateway file, contradicting Defaults item 7 ("Applied: … the file header rule (`enforce-file-metadata`)") | No effect | Stop reusing a project-structure-specific guard for file-metadata's own inclusion test. Give `enforce-file-metadata` its own guard — `isImplementationFileGuard` (already imported at `rule-enforce-file-metadata-broker.ts:12`) already returns the right single-dot/multi-dot answer with no `/src/` dependency. Drop the `shouldExcludeFileFromProjectStructureRulesGuard` call at `:38` and keep only the existing `isImplementationFileGuard` check at `:43`. This is a **1-line deletion that turns the rule back on** for gateway pass-throughs and wrappers — not a disable. |
| 3 | `enforce-implementation-colocation` — `rule-enforce-implementation-colocation-broker.ts:76-78`: `if (!filename.includes('/src/')) return;` | **False negative**: colocated `.test.ts`/`.proxy.ts` requirement never fires on any gateway wrapper, contradicting the gateway rule-set draft ("Wrapper: Colocated `.test` and `.proxy`") | No effect | Do **not** patch this rule to understand pass-through-vs-wrapper (see rule design in §3, "gateway colocation") — the distinction (pass-through needs neither, wrapper needs both) is gateway-specific and this rule has no concept of it. Leave this rule OFF for gateway paths (via the ignore glob in §1) and add a dedicated **new** gateway rule instead (§3, `gateway-colocation`). |
| 4 | `enforce-import-dependencies` — `rule-enforce-import-dependencies-broker.ts:58-62`: `const folderType = folderTypeTransformer({filename: ctx.filename ?? ''}); if (folderType === null) return;`, and `folder-type-transformer.ts:14-19` requires a literal `/src/` segment | Self-skips today (no `/src/`) — matches "Not applied: per-folder import allowlists" for free | Unchanged for the caller's OWN file (still has `/src/`); but its **cross-package classification half**, `validateExternalImportLayerBroker` (`validate-external-import-layer-broker.ts`), is what decides whether `import {readFileIfExists} from '@dungeonmaster/node/fs'` is allowed at all from a `brokers/` file. Today `@dungeonmaster/node/fs` is a bare cross-package subpath with no recognized folder-type segment (`importFolderTypeFromSubpathTransformer` only recognizes segments matching `folderTypeContract`, e.g. `contracts`, `brokers` — `fs` is not one), so it falls to the "main-barrel" classification (`:119-152`), finds no named-import folder types either, and lands on the external-package gate at `:154-164`: `canImportExternal = allowedImports.includes('node_modules')`. A `brokers/` folder's `allowedImports` includes `node_modules` (per the architecture table brokers can import `adapters`, and — check `folderConfigStatics` — brokers do NOT list `node_modules` today, only `adapters/` does) | **This is the load-bearing gap the whole raw-import-ban rule (§3) exists to close.** `enforce-import-dependencies` cannot be taught "gateway subpaths are allowed" cleanly, because the rule's whole model is folder-type-to-folder-type, and `@dungeonmaster/node/fs` is not a folder type. Add an explicit exception: `allowedImports` for every folder type gains a **new sentinel value**, e.g. `'gateway'`, resolved by checking `importSource` against `gatewayLocationsStatics`-derived package names (`@dungeonmaster/npm`, `@dungeonmaster/node`, `@dungeonmaster/browser`, `@dungeonmaster/bin`, plus their subpaths) inside `validateExternalImportLayerBroker`, ahead of the `node_modules` gate. This one exception, added once in the shared validator, is what lets every folder type (not just `adapters/`) import the gateway — matching "our workspace packages call each other directly" plus "the gateway replaces the `adapters/` folder type." |
| 5 | `ban-primitives` — `rule-ban-primitives-broker.ts:66-86` flags every `TSStringKeyword`/`TSNumberKeyword` in type position, gated only by file suffix (`stub`, `.d.ts`), no `/src/` dependency | **Would misfire** on every gateway wrapper signature: `readFileIfExists = (path: string): Promise<string | undefined>` is exactly what brief item 7 requires ("gateway wrappers take and return plain values … they never import zod contracts") | No effect (a caller still returns branded types from its own broker) | Not applied — carve out via the ignore glob (§1). Already the doc's own "Not applied" list; confirmed here as **necessary**, not merely listed, because unlike rows 1-4 this rule has no `/src/` gate to save it. |
| 6 | `forbid-type-reexport` — `rule-forbid-type-reexport-broker.ts:36-38`: `if (filename.endsWith('index.ts')) return {};`, else flags any `export type {X}` where `X` was `import type`-ed | Gateway pass-through entries ARE `index.ts` (`packages/npm/react/index.ts`), so they already fall into this rule's own existing `index.ts` exemption — **no misfire for pass-throughs**. But a gateway WRAPPER file re-exporting the outside package's own type (brief: "the package's own types … are still re-exported for code that needs them, such as Playwright's `Page`") is NOT named `index.ts` when the wrapper lives beside its `.test.ts`/`.proxy.ts` in a non-`index.ts` file — except the brief's flat layout makes `index.ts` the ONE entry per subpath folder, so every export (pass-through or wrapper) is re-exported through that folder's `index.ts` regardless. So in the flat layout as specified, this rule's existing exemption already covers every gateway export surface. | No effect | None needed for the flat layout as specified — but flag as fragile: if a wrapper folder ever needs an internal barrel of its own (unlikely per brief item 6: "no root `.` export … no barrel"), re-verify. Listed in "Not applied" defensively; no action required to make it correct today. |
| 7 | Brand/contract-return rules — `require-zod-on-primitives`, `require-contract-validation` (both in `dungeonmasterCustomRules`, `config-dungeonmaster-broker.ts:109-110`) | Would misfire on any gateway wrapper returning a plain value instead of a `.parse()`-validated brand | No effect | Not applied — ignore glob (§1). |
| 8 | "Only adapters may import npm packages" half of `enforce-import-dependencies` (the `node_modules` allowlist entry, checked at `validate-external-import-layer-broker.ts:154-164`) | Gateway needs the OPPOSITE of today's rule: every gateway file may import npm freely (it's the only place allowed to), but must NEVER import our own workspace packages. Today's rule has no "forbid workspace-package import" direction at all — it only gates `node_modules`. | For the caller, unaffected (still gated by its own folder's `allowedImports`) | New gateway-only rule, not a patch to this one (§3, `gateway shape rules → imports`). Reusing `enforce-import-dependencies` here would require inverting its entire allow-list model for one four-folder carve-out; a small dedicated rule is cleaner and the doc's own gateway rule-set draft table already separates "Imports" as its own row. |
| 9 | Proxy rules that only recognize mocking at `/adapters/` — TWO separate rules key on the literal substring `/adapters/` in the file path: `enforce-proxy-patterns` at `rule-enforce-proxy-patterns-broker.ts:307-314` (`isAdapterProxy = filename?.includes('/adapters/') && …`, gating `validateAdapterMockSetupLayerBroker`) and `jest-mocked-must-import` at `rule-jest-mocked-must-import-broker.ts:90-93` (gating the `mockingAdapter`/`notNpmPackage` messages) | **False negative**: a gateway wrapper's own proxy (e.g. `packages/node/fs/read-file-if-exists.proxy.ts`) is never inside a folder literally named `adapters/`, so neither rule ever checks that its constructor sets up `handle.calledWith([...])...`, nor that it only mocks npm packages — exactly the checks the gateway needs MOST, since every gateway proxy IS an I/O-boundary proxy. | **False negative for the caller too**: post-migration, a broker's OWN proxy (still literally at `.../brokers/.../foo-broker.proxy.ts`, no `/adapters/` segment) is what now mocks the gateway wrapper (`readFileIfExists` from `@dungeonmaster/node/fs`) directly, since "brokers call the gateway directly." That proxy is doing exactly the job an adapter's proxy used to do, but its path was never `/adapters/` — so this gap exists FOR CALLERS in the target architecture, not only inside the gateway. | Replace the raw `filename.includes('/adapters/')` check in BOTH rules with one shared guard, e.g. `isIoBoundaryProxyGuard({filename})`, that returns true for `/adapters/` **or** any of the four gateway package roots (`gatewayLocationsStatics.packageGlobs`, via `minimatchMatchAdapter` the way `no-bare-process-cwd` already does at `rule-no-bare-process-cwd-broker.ts:92-95`). This teaches both rules the new I/O boundary shape; it does not turn either off. **It deliberately does NOT extend to every caller broker's proxy** — that would require detecting "this specific mocked identifier came from a gateway import," which is a bigger AST-tracing job; flag as a follow-up for whoever builds `gateway-colocation`/`raw-import-ban`, since that rule already builds the "is this specifier a gateway import" check the proxy rules could reuse later. |
| 10 | `isNpmPackageGuard` — `guards/is-npm-package/is-npm-package-guard.ts:21-23`: `if (importSource.startsWith('@dungeonmaster')) { return importSource === '@dungeonmaster/shared/adapters'; }`, consumed by `jest-mocked-must-import` at `rule-jest-mocked-must-import-broker.ts:108` (`notNpmPackage` message) | A gateway file itself never calls this (it's a proxy-side guard for callers) | **Misfires on callers**: a caller's proxy legitimately does `jest.mocked(readFileIfExists)` where `readFileIfExists` is imported from `@dungeonmaster/node/fs` — a workspace package by name, so `isNpmPackageGuard` returns `false` for it (it only special-cases `@dungeonmaster/shared/adapters`), which trips `notNpmPackage` on genuinely correct gateway mocking | Extend the same special-case list this guard already has one entry of: add `@dungeonmaster/npm`, `@dungeonmaster/node`, `@dungeonmaster/browser`, `@dungeonmaster/bin` (and their subpaths) alongside the existing `@dungeonmaster/shared/adapters` exception, ideally reading the list from `gatewayLocationsStatics` (or a sibling `gatewayPackageNamesStatics`) so it stays in sync with the package-name-from-scope logic in §3's raw-import rule instead of a second hand-copied literal. |
| 11 | File/export naming — `enforce-project-structure`'s Level 3/4 (filename suffix, kebab-case, domain-prefix match, export-suffix match) | Already self-skips per row 1 | No effect | None; consistent with "Not applied: folder-type structure." Gateway wrapper naming (`readFile`, `readFileIfExists`, `currentBranch` — plain names, no folder-type suffix) is enforced instead by the NEW `gateway-colocation`/`gateway-layout` rules in §3, which know the flat, one-export-per-file shape without needing the domain-prefix machinery this rule carries. |

## 3. New rules

All new rules are ESLint rule brokers under `packages/eslint-plugin/src/brokers/rule/<rule-name>/`,
registered the same five places `packages/eslint-plugin/CLAUDE.md` "Adding New Rules" lists (rule
broker + test, `start-eslint-plugin.ts`, `config-dungeonmaster-broker.ts`, `dungeonmaster-rule-enforce-on-statics.ts`).

### 3a. `raw-import-ban`

| | |
|---|---|
| Flags | Outside the gateway (i.e., NOT matching `gatewayLocationsStatics.packageGlobs`): any `ImportDeclaration`/`ImportExpression` (value or type-only) whose source is a non-workspace package; any `CallExpression` `require('<pkg>')`, `import('<pkg>')`, or `require.resolve('<pkg>')` where `<pkg>` is a non-workspace package |
| Detects via | `isNpmPackageImportGuard` (already exists, `guards/is-npm-package-import/is-npm-package-import-guard.ts:10-17` — returns true for anything not starting with `.`/`/`; needs one adjustment: it currently returns `true` for `@dungeonmaster/*` too, so this rule must ALSO exclude `@dungeonmaster/*` workspace packages the way `isNpmPackageGuard` already does, i.e. reuse/extend that guard rather than `isNpmPackageImportGuard` as-is) plus a new mechanical mapper, `gatewayPathFromImportSourceTransformer`, doing exactly the brief's mapping: strip a leading `node:`; if the bare name is in `nodeBuiltinStatics.modules` (`statics/node-builtin/node-builtin-statics.ts:8-46`, already lists `fs`, `child_process`, `net`, `readline`, …) map to `` `${scope}/node/${bareName}` ``; else map to `` `${scope}/npm/${importSource}` ``. `scope` is read once, at rule-module load, from the root `package.json`'s `name` field (already how `config-dungeonmaster-broker.ts` and friends resolve repo-local values — no hard-coded `@dungeonmaster`), applying the doc's own "unscoped root → build `@<name>`" rule when the root name has no `@scope/` form. |
| Message | ``Raw import of "{{importSource}}" is not allowed outside the gateway. Import from "{{gatewayPath}}" instead.`` — e.g. `Raw import of "fs" is not allowed outside the gateway. Import from "@dungeonmaster/node/fs" instead.` and `Raw import of "lodash" is not allowed outside the gateway. Import from "@dungeonmaster/npm/lodash" instead.` |
| Test cases | VALID: import from `@dungeonmaster/node/fs` (gateway, allowed); import from `@dungeonmaster/shared/contracts` (workspace, allowed); a file INSIDE `packages/node/**` importing raw `fs` (gateway files are exempt — filename matches `gatewayLocationsStatics.packageGlobs`). INVALID: `import fs from 'fs'`; `import fs from 'node:fs'` (message still says `@dungeonmaster/node/fs`, prefix dropped); `import {z} from 'zod'` → `@dungeonmaster/npm/zod`; `import type {Page} from '@playwright/test'` (type-only still flagged, per doc "type-only imports go through the gateway too"); `require('glob')`; `await import('glob')`; `require.resolve('@anthropic-ai/claude-code')` → message names `@dungeonmaster/npm/@anthropic-ai/claude-code`. EDGE: scoped package `@hono/node-server` → `@dungeonmaster/npm/@hono/node-server` (subpath keeps the `@scope/name` intact, only prepended). |

### 3b. `platform-globals-ban`

| | |
|---|---|
| Flags | Outside the gateway: a runtime (non-type-position) use of an identifier that (a) is NOT locally imported/declared and (b) resolves, via the typed-lint program, to a declaration inside `lib.dom*`, `lib.webworker*`, or `@types/node`'s ambient globals |
| Detects via | Needs the type-checker (`context.sourceCode.getScope`/`services.program` — this repo's config already sets `parserOptions.project: true`, `eslint.config.js:97`, so a typed rule can call `context.sourceCode.getTypeChecker?.()`/the `@typescript-eslint/utils` `ESLintUtils.getParserServices(context)` pattern other typed rules here would use — none of the existing rule brokers read here do typed checking today, so this is genuinely new plumbing, not a copy of an existing pattern). For each bare `Identifier` in a value position (not `TSTypeReference`, not `TSQualifiedName`) with no local binding, resolve its declaration file via the checker's symbol; if that file path matches `lib.dom.d.ts`, `lib.dom.*.d.ts`, `lib.webworker.d.ts`, or is under `@types/node`, flag it — UNLESS the exempt list applies. `globalThis.X` counts as `X` (unwrap the `MemberExpression` first). |
| Exempts | `__dirname`, `__filename`, `require` (value position only — `require.resolve('<pkg>')`'s argument is separately caught by 3a); every `lib.es*` built-in (`JSON`, `Math`, `Promise`, `Array`, `Map`, `Set`, `Date`, `Error`, `RegExp`, `Symbol`, `Intl`) — these resolve to `lib.es*.d.ts`, never `lib.dom*`/`@types/node`, so the file-path check already excludes them with no extra list; type positions generally (`useRef<HTMLDivElement>`, `Buffer` as a type, `NodeJS.ErrnoException`) — checked by AST ancestor: skip if inside a `TSTypeAnnotation`/`TSTypeReference`/`TSTypeParameterInstantiation` |
| Message | ``Platform global "{{name}}" is not allowed outside the gateway. Import it from "{{gatewayPath}}" instead.`` where `gatewayPath` is `` `${scope}/node/${name}` `` or `` `${scope}/browser/${name}` `` by the importing package's detected platform (reuse `architecturePackageTypeDetectBroker`/`packageBrowserTypeTransformer`, `packages/shared/src/transformers/package-browser-type/package-browser-type-transformer.ts:23-48`, already how ward answers "is this package browser or Node" for e2e eligibility, `check-run-e2e-broker.ts:63`) |
| Test cases | VALID: `__dirname`, `__filename`, `require('./x')` (value use exempt); `Buffer` used as a TYPE annotation; `useRef<HTMLDivElement>(null)`; `import {stderr} from '@dungeonmaster/node/process'` then using `stderr`; any use inside `packages/node/**`/`packages/browser/**` (gateway itself is exempt — it's where these globals get wrapped). INVALID: `process.stderr.write(x)` in a Node package; `globalThis.fetch(url)` in a browser package (message names `@dungeonmaster/browser/fetch`); bare `fetch(url)` (no `globalThis.` prefix) in a Node package (message names `@dungeonmaster/node/fetch`); `crypto.randomUUID()` (Web Crypto global) in web; `setTimeout(fn, ms)` bare. EDGE: `Buffer` used as a VALUE (`Buffer.from(x)`) — flagged; `Buffer` used as a TYPE (`(b: Buffer) => void`) — not flagged, in the same test file, proving the AST-position guard actually discriminates. |
| Timing | Needs the typed program — per Defaults item 9, runs in ward if the pre-edit hook cannot give it typed info. The pre-edit hook parses one file in isolation (no project-wide type info readily available at that layer); confirm at implementation time whether `dungeonmasterRuleEnforceOnStatics` can mark this `post-edit` outright rather than attempting pre-edit, since `require-unicode-regexp`/AST-only rules are the pre-edit set today (`dungeonmaster-rule-enforce-on-statics.ts:12-25`) and nothing there currently uses `parserServices`. |

### 3c. `bin-program-spawn-ban`

| | |
|---|---|
| Flags | Outside `@dungeonmaster/bin`: a call to a `@dungeonmaster/node/child_process` export (`spawn`, `spawnCapture`, `execSync`-equivalent, whatever the wrapper names end up being) whose resolved command names a program with a home in `@dungeonmaster/bin` |
| Detects via | Read the call's first argument (or the `command` property of an options object) per the doc's exact algorithm (`scrolls/adapters-to-one-place.md:349`): a string literal; the first whitespace-separated word of a template literal or `sh -c '<script>'` string; a `MemberExpression` resolving to a statics value (follow one level: `SomeStatics.command` where `SomeStatics` is an imported `*Statics` object with a string literal property) or a module-level `const` string. Compare the resolved program name against a lookup table of "programs with a `@dungeonmaster/bin` home" (`git`, `npm`, `lsof`, `kill`, and — per doc step 3 — `require.resolve('@anthropic-ai/claude-code')` specifically, which 3a's `require.resolve` handling already intercepts, so this rule does not need to special-case Claude). Anything the resolver CANNOT read statically (a runtime value, per doc item 4) is allowed — this is a deliberate, not-a-loophole exemption already decided in the doc, so the rule must fail OPEN (no report) rather than flag "cannot determine command." |
| Message | ``spawning "{{program}}" directly is not allowed. Use {{binFunction}}() from "{{scope}}/bin/{{program}}" instead.`` e.g. spawning `'git'` with args `['rev-parse', '--abbrev-ref', 'HEAD']` → `spawning "git" directly is not allowed. Use currentBranch() from "@dungeonmaster/bin/git" instead.` — `binFunction` comes from a small lookup (`{git: {'rev-parse --abbrev-ref HEAD': 'currentBranch', ...}}`) keyed on the resolved args where the doc names a specific existing wrapper, falling back to a generic ``a wrapper in "{{scope}}/bin/{{program}}"`` when no specific suggestion is registered yet. |
| Test cases | VALID: `spawnCapture({command: 'git', ...})` written INSIDE `packages/bin/git/**` (the gateway's own implementation is exempt — this is where the wrapper lives); a runtime-resolved command (`spawnCapture({command: userConfig.devCommand})`) — must NOT be flagged, proving the fail-open path; `spawnCapture({command: claudeCliResolvedPath})` where `claudeCliResolvedPath` came from `require.resolve('@anthropic-ai/claude-code')` two lines earlier — also not flagged here (3a is what catches the `require.resolve` itself). INVALID: `spawn('git', ['rev-parse', ...])`; a template literal `` `git ${subcommand}` ``; `sh -c 'git status'`; `spawnCapture({command: lsofStatics.command})` where `lsofStatics = {command: 'lsof'} as const`. EDGE: `spawn('gitk')` (a program that merely STARTS WITH "git" but isn't `git`) — must NOT be flagged, proving the match is exact-token, not substring. |

### 3d. Gateway shape rules

Four checks, all path-scoped to `gatewayLocationsStatics.packageGlobs`, mirroring the "Tests" table's
draft. Given how small and distinct each is, and how differently each is detected, these are best
split into **two rule files**, not one mega-rule (see phasing, §5):

| Rule | Flags | Detects via | Message |
|---|---|---|---|
| `gateway-import-boundary` | Any import inside a gateway file whose source is one of our OWN workspace packages (`@dungeonmaster/*` other than another gateway package's own subpath, e.g. `@dungeonmaster/node` importing `@dungeonmaster/npm/glob` is fine — gateway packages may depend on each other — but `@dungeonmaster/node` importing `@dungeonmaster/shared/contracts` is not) | `isNpmPackageImportGuard` inverted, plus an explicit allow-list of the four gateway package names read from the same static as 3a | `Gateway files cannot import our own workspace packages ("{{importSource}}"). The gateway is the bottom layer — move logic that needs it out of the gateway into a broker that calls the gateway.` |
| `gateway-colocation` | A wrapper file (any `.ts` directly under a subpath folder, single-dot, NOT `index.ts`) missing a colocated `.test.ts` or `.proxy.ts`; an `index.ts` (pass-through entry) that is NOT solely `export *`/`export {default}` statements (i.e. contains a non-export statement, meaning it's secretly doing wrapper work and should be a real wrapper file instead); a pass-through `index.ts` that HAS a colocated `.test.ts`/`.proxy.ts` (over-application in the other direction — the doc says pass-throughs get "No test or proxy", so a stray one here is dead weight, not an error to auto-delete, but worth a soft flag) | Same `fsExistsSyncAdapter`-based colocation check `enforce-implementation-colocation` already uses (`rule-enforce-implementation-colocation-broker.ts:113-125` for the exists-check pattern), reused verbatim minus the `/src/` gate; "is this index.ts pure re-export" via a simple `Program.body` walk: every statement must be `ExportAllDeclaration` or `ExportNamedDeclaration` with no `declaration` (i.e. `export {default} from 'pkg'` is fine, a new `const`/`function` is not) | `missingTest`: ``Wrapper "{{fileName}}" needs a colocated {{fileName}}.test.ts.`` / `missingProxy`: analogous / `passThroughNotPureReexport`: ``Pass-through entry "{{fileName}}" may only re-export ("export * from '...'", "export { default } from '...'"). Found a non-export statement — this file wraps behavior, so name it as a wrapper with its own .test.ts/.proxy.ts instead.`` |
| `gateway-layout` | A subpath folder (`packages/node/fs/`) whose `index.ts` re-exports something NOT declared in that package's `package.json` `exports` map under the matching subpath (folders must mirror subpaths exactly, per brief); a gateway package whose `package.json` declares a root `"."` export | Read `package.json` once per package root (`fsReadFileSyncAdapter`/`fsExistsSyncAdapter`, same adapters `enforce-implementation-colocation` already uses), compare its `exports` keys against the folder tree | ``folderSubpathMismatch``: ``Folder "{{folder}}/" has no matching "./{{folder}}" entry in package.json exports. Folders must mirror subpath exports exactly.`` / ``noRootExport``: ``package.json may not declare a root "." export — that would be a barrel.`` |

Type re-exports are explicitly **allowed** (doc: "re-exporting types is the gateway's job") — this is
not a new rule to write, it is the ABSENCE of `forbid-type-reexport` and `ban-primitives` in the
gateway rule set (§1's carve-out), already covered.

"Proxies for callers … exported through a `./testing` subpath" — already true structurally in the
scaffolded packages (`packages/node/package.json`'s `exports` already has a `./testing` entry); no new
lint rule needed beyond `gateway-layout` catching a package that DROPS its `./testing` entry while still
having `.proxy.ts` files under it (add as a third `gateway-layout` case: every subpath folder with at
least one `*.proxy.ts` file must have its proxy re-exported through `./testing`'s `index.ts` — check via
the same "read `package.json`, read the folder" pass).

### 3e. Platform-crossing check (browser code reaching `@dungeonmaster/node`)

**This cannot be a normal lint rule; it has to be a ward check**, exactly as Defaults item 9 already
decides ("The import-following platform check runs in ward, because it needs the whole import graph")
and as the design doc's own cost line says (`scrolls/adapters-to-one-place.md:280`: "the check needs
the repo-wide import graph, so it runs in ward, not in the per-edit hook"). A per-file ESLint rule sees
one file's own imports; it cannot see that `web`'s `chat-widget.tsx` transitively reaches
`shared/brokers/cwd-resolve.ts` which imports `@dungeonmaster/node/fs` three hops away, because ESLint's
`context` gives a rule the current file's AST, not a resolved dependency graph across packages.

**Sketch**, as a new ward check type (or a step inside the existing `lint` check — needs a design call
outside this doc's scope, flagged here rather than decided): for every package whose detected platform
is `browser` (via `architecturePackageTypeDetectBroker`/`packageBrowserTypeTransformer`, same detection
`check-run-e2e-broker.ts:63` already calls), build the transitive import graph starting from that
package's own files (a `ts.Program`/`ts.resolveModuleName` walk — the same mechanism the
`<dungeonmaster-worktrees>` fencing snippet already uses elsewhere in this repo for a related "hide
paths outside X" problem, so the walking machinery has precedent here), and if any REACHED file (not
just directly imported) resolves to `@dungeonmaster/node/**`, report the whole chain:
`web (browser) → shared/brokers/cwd-resolve → @dungeonmaster/node/fs`, naming every hop, per the doc's
own example. Node-platform packages reaching `@dungeonmaster/browser/**` is the mirror case and gets
the identical treatment.

## 4. Test infrastructure for rule authors

Every rule broker under `packages/eslint-plugin/src/brokers/rule/**` is tested with ESLint's
`RuleTester`, never plain Jest `describe`/`it` — this is a DSL/integration-test case per
`get-testing-patterns`' "Unit Tests vs Integration Tests" section ("ESLint rules … run fully real to
validate logic"), and `packages/eslint-plugin/src/brokers/rule/CLAUDE.md` gives the exact shape:

```ts
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleRawImportBanBroker } from './rule-raw-import-ban-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('raw-import-ban', ruleRawImportBanBroker(), {
  valid: [{ code: `import { readFileIfExists } from '@dungeonmaster/node/fs';`, filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts' }],
  invalid: [{
    code: `import fs from 'fs';`,
    filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
    errors: [{ messageId: 'rawImport', data: { importSource: 'fs', gatewayPath: '@dungeonmaster/node/fs' } }],
  }],
});
```

**Layer brokers** (helper files inside a rule's own folder, e.g. a would-be
`resolve-spawned-program-layer-broker.ts` for 3c's command-resolution step) are the ONE exception: they
use ordinary Jest `describe`/`it` with a `.proxy.ts` and `EslintContextStub`/`TsestreeStub`, per the same
CLAUDE.md's "Layer Broker Tests" section — call the layer directly, assert on `context.report()` calls,
never through `RuleTester`. Any rule broken into layers (3c and the two 3d rules are the most likely
candidates, given each has a distinct "resolve X, then check Y" shape) should follow that split from the
start rather than growing one monolithic `create()`.

Rules needing typed info (`platform-globals-ban`) still use `RuleTester` — it already supports
`parserOptions: {project: true}` per-test, and the existing config's `tsparser`/`project: true` setup
(`eslint.config.js:92-99`) is what `eslintRuleTesterAdapter` should mirror; confirm at build time whether
`eslintRuleTesterAdapter` (`packages/eslint-plugin/src/adapters/eslint/rule-tester/eslint-rule-tester-adapter.ts`)
already sets `project: true` or needs a variant for typed rules.

## 5. Phasing — 1-3 rule files per agent, gateway-clean first

| Wave | Chunk | Files | Depends on |
|---|---|---|---|
| 0 | Shared statics | `gatewayLocationsStatics` (or extend `locationsStatics`) in `@dungeonmaster/shared/statics`; `gatewayPathFromImportSourceTransformer` in eslint-plugin | none — everything else reads this |
| 1 | Fix the two false-negative guards | `enforce-file-metadata` (drop the `shouldExcludeFileFromProjectStructureRulesGuard` call, §2 row 2); the shared `isIoBoundaryProxyGuard` + its two call sites in `enforce-proxy-patterns` and `jest-mocked-must-import` (§2 row 9); `isNpmPackageGuard`'s exception list (§2 row 10) | Wave 0's statics |
| 2 | Carve out the gateway | `eslint.config.js` ignore glob + new gateway block (§1); the `enforce-import-dependencies` gateway-sentinel exception in `validate-external-import-layer-broker.ts` (§2 row 4) | Wave 0, 1 |
| 3 | Gateway shape rules, part 1 | `gateway-import-boundary`, `gateway-colocation` (§3d) | Wave 2 (needs the carve-out's file globs to know what "inside the gateway" means for its own exemptions) |
| 4 | Gateway shape rules, part 2 | `gateway-layout` (§3d, the `./testing` re-export check folded in) | Wave 3 |
| 5 | Caller-facing rule, mechanical half | `raw-import-ban` (§3a) — this is the rule every OTHER package's ward run depends on for "did I import raw" | Wave 0 |
| 6 | Caller-facing rule, typed half | `platform-globals-ban` (§3b) | Wave 5 (shares the scope/mapping helper) |
| 7 | Bin-program rule | `bin-program-spawn-ban` (§3c) | Wave 5 (reuses `raw-import-ban`'s `require.resolve` handling for the Claude CLI case, so it should not re-detect that itself) |
| 8 | Ward-level check | Platform-crossing import-graph walk (§3e) — explicitly OUT of ESLint; design its home (new ward check type vs. a step inside `lint`) before implementing | Waves 5-7, since it should reuse whatever import-resolution helper `raw-import-ban`/`gateway-import-boundary` end up sharing |

Ordering rationale: gateway files have to lint clean under the CARVE-OUT before any caller-facing rule
(`raw-import-ban`, `platform-globals-ban`) goes live, because those rules exempt gateway paths by the
same glob the carve-out defines — turning them on first, before the carve-out exists, would make the
gateway's OWN wrapper files (which still contain raw `fs`/`process` calls, that being their entire job)
fail lint immediately. Per Defaults item 10 (repo-wide migration order), these new rules stay OFF
(commented out in `dungeonmasterCustomRules`, not merged) until the corresponding wave finishes AND a
scoped `ward -- --only lint` run against a sample of already-migrated files is green — this is the
"add it, prove it catches today's misalignments, then comment it out" loop the user asked for, and each
wave above is sized so one agent can do that loop in one sitting.

## Summary (10 lines)

1. Gateway packages already exist with **no `src/`** — this alone silently switches off `enforce-project-structure`, `enforce-import-dependencies`, and (bug) `enforce-file-metadata`/`enforce-implementation-colocation`, which should be ON.
2. The carve-out is an ADDITIVE `ignores` glob plus a new gateway rule block in `eslint.config.js`, driven from one new shared static — never a rule flipped `off`.
3. Two existing guards falsely skip gateway files today: `enforce-file-metadata` (fix: stop reusing `shouldExcludeFileFromProjectStructureRulesGuard`) and the `/adapters/`-substring gate shared by `enforce-proxy-patterns` and `jest-mocked-must-import` (fix: a shared `isIoBoundaryProxyGuard`).
4. `isNpmPackageGuard` needs the same `@dungeonmaster/shared/adapters` exception extended to all four gateway packages, or callers' proxies get falsely flagged for correctly mocking a gateway wrapper.
5. `ban-primitives`, `forbid-type-reexport`, `require-zod-on-primitives`, `require-contract-validation` genuinely must go OFF for gateway paths — no `/src/` gate saves them, so they need the ignore glob.
6. `enforce-import-dependencies`'s external-import gate needs one new sentinel ("gateway") so every folder type, not just `adapters/`, can import the four gateway packages.
7. New rules: `raw-import-ban` (mechanical, scope read from root `package.json`), `platform-globals-ban` (typed, needs the type-checker), `bin-program-spawn-ban`, and four gateway-shape rules (`gateway-import-boundary`, `gateway-colocation`, `gateway-layout`, plus the `./testing` check folded into layout).
8. The platform-crossing check cannot be ESLint at all — it needs the whole import graph, so it is a ward check, per the doc's own explicit call.
9. Rule brokers use `RuleTester`, never Jest `describe`/`it`; only layer-helper files inside a rule folder get plain Jest tests.
10. Phasing: statics first, then fix the two false-negative guards, then carve out, then gateway-shape rules, then the three caller-facing new rules, then the ward-level graph check last.

## Decisions made while building

Built against the LIVE tree, not this doc's research snapshot: the scaffolded gateway packages
now have a real `src/` (the doc's "no `src/`" ground truth is stale — confirmed via
`find packages/node/src` and `packages/node/package.json`'s `exports`). That changes which rules
self-skip for free: `enforce-project-structure`'s `shouldExcludeFileFromProjectStructureRulesGuard`
no longer excludes gateway files (a real `/src/` segment exists), so `enforce-file-metadata` and
`enforce-implementation-colocation` already run correctly with NO code change — §2 rows 1-2's
"self-skips, no adjustment needed" premise was right about the OUTCOME (no change needed) but
wrong about WHY (the guard now includes them, not excludes).

**A load-bearing ESLint flat-config bug, found empirically, not in the doc.** Adding the gateway
globs to the main TypeScript block's `ignores` (§1's sketch) makes ESLint's config-array resolver
mark the file as **globally unlintable** (`calculateConfigForFile` returns `undefined`, `eslint
<file>` reports "File ignored because no matching configuration was supplied"), even though a
LATER config object's `files` matches the same path — reproduced in isolation
(`node_modules/@eslint/config-array/dist/cjs/index.cjs`, the "universal pattern" branch around
line 1289): a `files` entry ending in bare `/**` or `/*` is treated as "universal" and is only
honored when ANOTHER matching config ALSO has an extension-specific pattern for that same file.
The gateway block's `files` were exactly `packages/<x>/src/**` — all bare `/**`. **Fix:** the
gateway config block's `files` append `/*.ts` (`packages/<x>/src/**/*.ts`), giving ESLint a
concrete extension so the carve-out's `ignores` on the main block resolves the way the doc
intended. `gatewayLocationsStatics.packageGlobs` itself is unchanged (still bare `/**`, since
every OTHER consumer — `isIoBoundaryProxyGuard`, `isGatewayFileGuard`, `enforce-import-dependencies`'s
sentinel — does prefix/substring matching, not ESLint glob resolution).

**The TEST rule block is not carved out (confirmed, matches the doc), which forced two rules to
be TAUGHT rather than omitted, even though both are also in the "must go off" bucket per §1 row
5.** `ban-primitives` and `enforce-stub-usage` fired for real on gateway `.test.ts` files in a
live `ward lint` sweep (`packages/node/src/fs/promises/index.test.ts`) — the config carve-out
only reaches files matched by the gateway's OWN block glob, and neither rule's applicability is
gated by that; both are shared into `testConfig` via `dungeonmasterCustomRules` same as
`typescriptConfig`, and the test block still applies by file suffix everywhere. Both rules now
call a new `isGatewayFileGuard({filename})` (guards/is-gateway-file) directly in their own
`create()`, alongside their existing `.stub.ts`/`.d.ts` exemptions — covering implementation AND
test with one mechanism, so they were REMOVED from the config-level omission list (redundant with
the in-rule guard, and the in-rule guard is what actually does the work).

`ban-adhoc-types` is a THIRD rule discovered misfiring live (not in the brief's original list): it
flagged `export interface FsError extends Error {...}` in `packages/node/src/fs/is-fs-error.ts` —
exactly the brief's "no contracts for outside packages" plain-type pattern. Added to the
config-level omission list (implementation-only misfire; no gateway `.test.ts` case surfaced it,
so no in-rule guard was needed).

| Rule | Decision | Reason |
|---|---|---|
| `enforce-project-structure` | Omit from gateway config (implementation-only; `ignores` on the main block) | The gateway's flat "one folder per subpath name" layout has no `folderTypeContract` member for `fs`/`process`/etc. — a structural mismatch, not a migration gap. Superseded by the plan's own future `gateway-layout`/`gateway-colocation` rules (§3d, out of this wave's scope). |
| `ban-primitives` | Teach the rule directly (`isGatewayFileGuard` in `rule-ban-primitives-broker.ts`); removed from the config omission list as redundant | Gateway wrappers take/return the outside package's own plain values by design (brief item 7) — permanent, not temporary. Needed a rule-level guard anyway because it also fires in `.test.ts`, which the config carve-out cannot reach. |
| `enforce-object-destructuring-params` | Omit from gateway config (implementation-only) | A same-name wrapper keeps the outside function's positional shape (Orchestrator ruling #1) — permanent by design. Not taught in-rule: distinguishing "same-name wrapper" from "new-name wrapper" needs cross-referencing the wrapped package's own signature, a bigger, AST-tracing job flagged here as a follow-up for whoever builds the gateway-shape rules. |
| `enforce-proxy-child-creation` | Omit from gateway config (implementation-only) | The rule's whole model is "for each implementation import, a proxy import+creation of `<name>Proxy`" — gateway proxies mock the outside function directly (`registerMock({fn: readFileSync})` / `jest.spyOn(fs, 'readFileSync')`), with no child-proxy delegation at all. Structural mismatch, not a gap; no dedicated gateway replacement written in this wave. |
| `enforce-stub-patterns` | Omit from gateway config (implementation-only) | Fires only on `.stub.ts` files; gateway stubs (e.g. `FsErrorStub`) build a plain shape mirroring the outside package's own error, with no zod contract to `.parse()` — the rule's `useContractParse` check cannot pass by design. |
| `enforce-stub-usage` | Teach the rule directly (`isGatewayFileGuard` in `rule-enforce-stub-usage-broker.ts`); removed from the config omission list as it was never reachable there | Fires only on `.test.ts` files, which the config carve-out (scoped to the gateway's own implementation glob) never reaches at all — the config-level entry would have been dead weight. Gateway tests build plain fixture objects (a Node error shape, a stat result) with no contract-backed stub to reach for. |
| `no-bare-process-cwd` | Teach the rule (extend `noBareProcessCwdStatics.defaults.allowedFolders` with `**/packages/node/src/process/**`) | The rule's whole job is "ban raw `process.cwd()` outside the ONE sanctioned wrapper" — excluding the gateway wholesale would let every OTHER gateway file call `process.cwd()` directly too, defeating the point. `@dungeonmaster/node/process`'s own `cwd` export is that sanctioned wrapper, so it earns the same allowlist entry `adapters/process/cwd/` already has, and the rule stays ON for every other gateway file. |
| `ban-adhoc-types` | Omit from gateway config (implementation-only) | Gateway wrapper types (`FsError`, `DirEntrySync`, `WalkedFile`, …) are plain `interface`/`type` declarations by design — brief item 7 says the gateway never imports zod contracts, so there is no contract to define these in instead. |

Also decided, not previously in the brief's list:

- `enforce-import-dependencies`: added a gateway sentinel to `validateExternalImportLayerBroker`
  (ahead of the `node_modules` gate) so every folder type — not just `adapters/` — may import any
  of the four gateway packages or their subpaths, per §2 row 4.
- `isIoBoundaryProxyGuard` (new, `guards/is-io-boundary-proxy`) replaces the bare `/adapters/`
  substring check in `enforce-proxy-patterns` and `jest-mocked-must-import`, per §2 row 9 — both
  rules now run their adapter-shaped checks on a gateway proxy the same as on a `/adapters/` one.
- `isNpmPackageGuard` extended: a gateway subpath (`@dungeonmaster/node/fs`, …) is now treated as
  mockable, alongside the existing `@dungeonmaster/shared/adapters` exception, per §2 row 10.
- `enforce-file-metadata`: re-verified against the live tree and left UNCHANGED. The lint plan's
  §2 row 2 "false negative" was diagnosed against the stale no-`/src/` ground truth; with a real
  `/src/` present, `shouldExcludeFileFromProjectStructureRulesGuard` already returns `false` for
  gateway files, so the rule already applies with no code change.
- `packages/node/src/net/free-port-pair.test.ts`: `jest/prefer-equality-matcher` vs
  `@dungeonmaster/ban-negated-matchers` conflict resolved by asserting a positive fact instead —
  `new Set([firstPort, secondPort]).size` is `2` — rather than adjusting either rule.
