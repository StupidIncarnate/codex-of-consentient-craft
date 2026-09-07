# CLI Package - Claude Session Guide

## Purpose

The CLI package provides the `dungeonmaster` binary:

- `dungeonmaster init` - Discovers all packages and runs their `StartInstall` functions to set up devDependencies
- `dungeonmaster create-package` - Scaffolds a new workspace package (see below)
- `dungeonmaster statusline-tap` - Reads Claude Code's statusline payload on stdin, records rate limits, echoes it back
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
| `transformers/workspace-scope-detect/`                  | reads the npm scope off the root package.json's own workspace deps |
| `brokers/create-package/resolve-request/`               | fills the gaps by prompt or refuses by flag — the only file that knows the two modes apart |
| `transformers/package-scaffold-files/`                  | request → the complete `ScaffoldFile[]`; PURE, which is what makes `--dry-run` truthful |
| `brokers/package/scaffold-write/`                       | writes them; refuses when the target directory already exists      |
| `brokers/package/register/`                             | adds the package to the root package.json `dependencies`           |

**What each type gets is a seed**, split across `statics/package-seed-{plain,service,frontend}-statics.ts` — one entry
per `packageTypeContract` value, holding that type's dependencies, `bin`, extra `compilerOptions`, jest flavour and
source templates. Templates carry `__NAME__` / `__CAMEL__` / `__PASCAL__` / `__TESTID__` / `__SCOPE__` placeholders that
`packageScaffoldFilesTransformer` substitutes.

**Each seed exists to satisfy that type's rule in `architecturePackageTypeDetectBroker`**, so a scaffolded package is
detected as the type it was asked for — `src/adapters/hono/` for `http-backend`, `src/widgets/` plus a react dependency
for `frontend-react`, a bin entry plus `process.argv` for `cli-tool`, and so on. Changing a seed's folder names breaks
that round-trip, and `packages/cli/src/transformers/package-scaffold-files/package-scaffold-files-transformer.test.ts`
is what catches it.

**The config values come from what the packages on disk actually carry, not from the prose.**
`statics/package-scaffold-config/package-scaffold-config-statics.ts` holds them and its header names the three that a
hand-copied config gets wrong.

## Architecture

```
dungeonmaster init
  -> StartCli({ command: 'init' })
    -> installRunBroker({ context })
      -> packageDiscoverBroker({ dungeonmasterRoot })  // finds packages/*/dist/startup/start-install.js
      -> installOrchestrateBroker({ packages, context })
        -> installExecuteBroker() for each package     // dynamic import + call StartInstall
```

## Testing

- Unit tests use proxy files for mocking (no direct `jest.mock`/`jest.spyOn` — use `registerMock`/`registerSpyOn` from `@dungeonmaster/testing/register-mock`)
- Integration tests for startup files use `installTestbedCreateBroker` for isolated temp directories
- Integration test (`bin/cli-entry.integration.test.ts`) uses `test/harnesses/cli-bin/cli-bin.harness.ts`. Its file-structure
  assertions (`binExists`, `readBinContent`, `requireWithoutAutorun`) grade the built esbuild bundle at
  `dist/bin/dungeonmaster.js`, so those require `npm run build` first. `runInit()` instead spawns the SOURCE entry
  (`bin/cli-entry.ts`) directly under `tsx --conditions=source`, so it exercises real CLI behaviour without a build.
