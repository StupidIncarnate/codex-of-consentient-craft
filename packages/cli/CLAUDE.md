# CLI Package - Claude Session Guide

## Purpose

The CLI package provides the `dungeonmaster` binary:

- `dungeonmaster init` - Discovers all packages and runs their `StartInstall` functions to set up devDependencies,
  then runs every package's optional `StartInstallFinalize` (`start-install-finalize.js`) once every package's
  `StartInstall` has finished
- `dungeonmaster create-package` - Scaffolds a new workspace package (see below)
- `dungeonmaster gateway-sync` - Gives every `dependencies` entry a folder under `packages/@gateway/npm/src/` (a copy
  of dungeonmaster's own wrapper when the installed version satisfies the range `@dungeonmaster/npm` declares for it
  and the copy compiles there, otherwise a generated passthrough) and prints what it did, including each wrapper it
  passed over and why, and a warning when the closing lockfile `npm install` failed; `init`, the root `postinstall`
  script `init` writes, and the hooks package's post-bash hook after `npm install <pkg>` all run it
- `dungeonmaster statusline-tap` - Reads Claude Code's statusline payload on stdin, records rate limits, echoes it back
- `dungeonmaster siegelense driver --instance <id>` - Launches the siegelense driver process for one instance;
  `dungeonmaster siegelense` bare prints the same view as `dungeonmaster siegelense status`
- `dungeonmaster` (default) - Launches the HTTP server and opens the web UI in a browser

## Key Files

| File                                        | Purpose                                        |
|---------------------------------------------|------------------------------------------------|
| `startup/start-cli.ts`                      | CLI entry point (init command + server launch) |
| `startup/start-install.ts`                  | Package-level install logic (adds devDeps)     |
| `brokers/install/run/install-run-broker.ts` | Orchestrates discovery + installation          |
| `brokers/package/discover/`                 | Discovers packages with install scripts        |
| `statics/dev-dependencies/`                 | Dev package version configuration              |

## `dungeonmaster create-package`

Scaffolds a workspace package with the config `packages/CLAUDE.md` prescribes, so nobody hand-copies JSON.

```bash
dungeonmaster create-package --name <name> --type <packageType> [--description "<text>"] [--dir packages] [--dry-run]
```

`--type` takes a `packageTypeContract` value. **Both modes are first-class.** With NO arguments at a TTY it prompts
for name, type and description; with ANY argument it never touches stdin, and a missing `--name` or `--type` fails
with a message naming that flag. Zero arguments with no TTY fails the same way rather than hanging, which is what
makes it safe to call from a script or an agent.

The pieces, in the order the responder calls them:

| File                                                    | Job                                                                |
|---------------------------------------------------------|--------------------------------------------------------------------|
| `transformers/create-package-args-parse/`               | argv → `CreatePackageArgs`; throws on an unknown flag or a missing value |
| `@dungeonmaster/shared/transformers`'s `workspaceScopeFromRootNameTransformer` | reads the npm scope off the root package.json's own `name` (falling back to the target directory's basename) — the SAME detector `init`'s gateway step used to name `packages/@gateway/*`, so a new package's scope always agrees with theirs. Never a dependency-list scan: a consumer's own `devDependencies` carry the tool vendor's `@dungeonmaster/*` scope, not the consumer's own |
| `brokers/create-package/resolve-request/`               | fills the gaps by prompt or refuses by flag — the only file that knows the two modes apart |
| `transformers/package-scaffold-files/`                  | request → the complete `ScaffoldFile[]`; PURE, which is what makes `--dry-run` truthful |
| `brokers/package/scaffold-write/`                       | writes them; refuses when the target directory already exists      |
| `brokers/package/register/`                             | adds the package to the root package.json `dependencies`           |

**What each type gets is a seed**, split across `statics/package-seed-{plain,service,frontend}-statics.ts` — one entry
per `packageTypeContract` value, holding that type's dependencies, `bin`, extra `compilerOptions`, jest flavour and
source templates. Templates carry `__NAME__` / `__CAMEL__` / `__PASCAL__` / `__TESTID__` / `__SCOPE__` placeholders that
`packageScaffoldFilesTransformer` substitutes.

**Each seed exists to satisfy that type's rule in `architecturePackageTypeDetectBroker`**, so a scaffolded package is
detected as the type it was asked for — a `src/flows/` folder plus a `hono` dependency for `http-backend`, `src/widgets/`
plus a react dependency for `frontend-react` (an ink dependency for `frontend-ink`), a bin entry plus `process.argv` for
`cli-tool`, and so on. A seed imports no npm package: the npm-gateway sync fills `@gateway/npm` for every
`dependencies` entry, so a seed declares the dependency and gets its `#gateway/npm/<subpath>` wrapper from the next
sync — the `npm install` that `create-package` prints as a next step runs one through the root `postinstall`, and
`init` runs one too. A consumer has no
`shared` package either, so a seed never depends on `__SCOPE__/shared`; a seed that reads argv or writes to a stream
imports it from `#gateway/node/process` and declares `__SCOPE__/node`, and one that needs no platform value touches no
global at all. A seed holds no
`adapters/` folder. `__SCOPE__` is the workspace scope `create-package` read from the root package.json (or, without one
passed in, the scope derived from the package name), never an empty string. Changing a seed's folder names breaks
that round-trip, and `packages/cli/src/transformers/package-scaffold-files/package-scaffold-files-transformer.test.ts`
is what catches it.

**A scaffolded package has the workspace layout.** Its barrel sits at `src/<folderType>/<folderType>.ts` (the seed's
`barrel.fileName` names the folder type, `barrel.exportPaths` are relative to that barrel), and `package.json` `exports`
holds `.` (only where the type has an entry), `./package.json`, one explicit key per barrel, and single-star
`./*.proxy` and `./*.stub` keys carrying only a `source` condition. It has no root barrel, no `testing.ts` and no
`./testing` key: a test imports each stub and proxy from its own file, for example
`@dungeonmaster/shared/contracts/path-segment/path-segment.stub`. `init`'s gateway packages carry `./package.json` plus
the three pattern keys with the full condition set.

**The config values come from what the packages on disk actually carry, not from the prose.**
`statics/package-scaffold-config/package-scaffold-config-statics.ts` holds them and its header names the three that a
hand-copied config gets wrong.

**A scaffolded package's `jest.config.js` body depends on where `create-package` runs.** THIS checkout has a
repo-root `jest.config.base.js` its own packages `require('../../jest.config.base.js')`; a consumer repo has no such
file and needs the published `@dungeonmaster/testing/jest-config-base` instead. `CliCreatePackageResponder` checks
disk for that repo-root file once and passes the answer to `packageScaffoldFilesTransformer` as
`usesPublishedJestBase`, which stays pure and only branches on the boolean.

## `dungeonmaster siegelense`

Every call is `dungeonmaster siegelense <call>`. The names that route to a responder are the keys of
`siegelenseHelpStatics.calls` (`packages/siegelense/src/statics/siegelense-help/siegelense-help-statics.ts`),
which is exactly the closed set `siegelenseCallStatics.calls.names`
(`packages/siegelense/src/statics/siegelense-call/siegelense-call-statics.ts`) holds — every name in
the spec is routed. Any other name answers "unknown subcommand". `dungeonmaster siegelense --help`
prints the index (one line per built call); `dungeonmaster siegelense <call> --help` prints that
call's flags, refusals and example.

**`CliSiegelenseResponder` validates nothing, and must stay that way.** It forwards `args` verbatim
into a dynamic import of `@dungeonmaster/siegelense/startup`. `SiegelenseFlow`'s route table, keyed by
the same names `siegelenseHelpStatics.calls` holds, is the single source of truth for which
subcommand exists and what its flags are — a second copy of that list in this responder is exactly
what shipped `status` and `cleanup` fully built and fully tested, yet untypeable.

The import is dynamic, never static: a static import would pull Playwright — a peer dependency of
`@dungeonmaster/siegelense`, needed only to boot a browser lane — into the esbuild bundle that becomes
`dist/bin/dungeonmaster.js`, the binary every consumer installs whether or not they ever run a
siegelense call.

Every built call renders a concise, token-efficient human-readable view by default. Passing `--json`
writes the raw JSON document to stdout instead. Unrecognised flags write nothing to stdout and exit 1
with an error listing the accepted flags for that command.

`packages/cli/bin/cli-entry.integration.test.ts` is the seam test, spawning the real binary through
`cliBinHarness` — every other siegelense test in the repo starts at `SiegelenseFlow` or below, so only
a process spawned above `CliSiegelenseResponder` can prove the gate itself stays open.

## Architecture

```
dungeonmaster init
  -> StartCli({ command: 'init' })
    -> installRunBroker({ context })
      -> packageDiscoverBroker({ dungeonmasterRoot })  // finds packages/*/dist/startup/start-install.js and each package's optional dist/startup/start-install-finalize.js
      -> installOrchestrateBroker({ packages, context })
        -> installExecuteBroker() for each package                    // dynamic import + call StartInstall
      -> installFinalizeOrchestrateBroker({ packages, context })       // after every package's StartInstall above has finished
        -> installExecuteBroker({ exportName: 'StartInstallFinalize' }) for each package that has a start-install-finalize.js
```

## Testing

- Unit tests use proxy files for mocking (no direct `jest.mock`/`jest.spyOn` — use `registerMock`/`registerSpyOn` from `@dungeonmaster/testing/register-mock`)
- Integration tests for startup files use `installTestbedCreateBroker` for isolated temp directories
- Integration test (`bin/cli-entry.integration.test.ts`) uses `test/harnesses/cli-bin/cli-bin.harness.ts`. Its file-structure
  assertions (`binExists`, `readBinContent`, `requireWithoutAutorun`) grade the built esbuild bundle at
  `dist/bin/dungeonmaster.js`, so those require `npm run build` first. `runInit()` instead spawns the SOURCE entry
  (`bin/cli-entry.ts`) directly under `tsx --conditions=source`, so it exercises real CLI behaviour without a build.
