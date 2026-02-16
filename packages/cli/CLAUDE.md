# CLI Package - Claude Session Guide

## Purpose

The CLI package provides the `dungeonmaster` binary with two commands:

- `dungeonmaster init` - Discovers all packages and runs their `StartInstall` functions to set up devDependencies
- `dungeonmaster` (default) - Launches the HTTP server and opens the web UI in a browser

## Key Files

| File                                        | Purpose                                        |
|---------------------------------------------|------------------------------------------------|
| `startup/start-cli.ts`                      | CLI entry point (init command + server launch) |
| `startup/start-install.ts`                  | Package-level install logic (adds devDeps)     |
| `brokers/install/run/install-run-broker.ts` | Orchestrates discovery + installation          |
| `brokers/package/discover/`                 | Discovers packages with install scripts        |
| `statics/dev-dependencies/`                 | Dev package version configuration              |

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

- Unit tests use proxy files for mocking (no `jest.spyOn` in test files)
- Integration tests for startup files use `installTestbedCreateBroker` for isolated temp directories
- E2E test (`bin/dungeonmaster.e2e.test.ts`) requires `npm run build` first
