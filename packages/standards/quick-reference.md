**PRIMARY SOURCE: Architecture HTTP API**

Get complete architecture information dynamically:

```bash
# Complete orientation (all folders, layers, rules):
curl -s http://localhost:${DUNGEONMASTER_PORT:-4737}/api/docs/architecture

# Deep dive on specific folder:
curl -s http://localhost:${DUNGEONMASTER_PORT:-4737}/api/docs/folder-detail/brokers

# Universal syntax rules:
curl -s http://localhost:${DUNGEONMASTER_PORT:-4737}/api/docs/syntax-rules
```

This page is a human-readable backup only. The HTTP API provides the authoritative, always-current source.

---

# Quick Reference Guide

## Allowed Folders

```
@types/             TypeScript *.d.ts files (package root only)
src/
├── statics/        # Immutable values (constants, enums, configs)
├── contracts/      # Zod schemas, types, and stubs ONLY
├── guards/         # Pure boolean functions (type guards)
├── transformers/   # Pure data transformation
├── errors/         # Error classes
├── flows/          # Route definitions and entry points
├── adapters/       # External package configuration/policy
├── middleware/     # Infrastructure orchestration (combines adapters)
├── brokers/        # Business operations and orchestration
├── bindings/       # Reactive connections (React hooks, watchers)
├── state/          # Data storage and memory management
├── responders/     # Route handlers
├── widgets/        # UI components (when UI exists)
├── startup/        # Application bootstrap
├── assets/         # Static files
├── migrations/     # Version upgrades
```

## Forbidden Folders - Where Code Actually Goes

| FORBIDDEN     | USE INSTEAD                | WHY                                                            |
|---------------|----------------------------|----------------------------------------------------------------|
| utils/        | adapters/ or transformers/ | Based on whether it wraps external packages or transforms data |
| lib/          | adapters/                  | External package wrappers only                                 |
| helpers/      | guards/ or transformers/   | Boolean functions -> guards/, others -> transformers/          |
| common/       | Distribute by function     | No catch-all folders allowed                                   |
| shared/       | Distribute by function     | No catch-all folders allowed                                   |
| core/         | brokers/                   | Business logic operations                                      |
| services/     | brokers/                   | Business operations                                            |
| repositories/ | brokers/                   | Data access operations                                         |
| models/       | contracts/                 | Data definitions and validation                                |
| types/        | contracts/                 | All types and interfaces                                       |
| interfaces/   | contracts/                 | Type definitions                                               |
| validators/   | contracts/                 | Validation schemas only                                        |
| constants/    | statics/                   | Immutable values, enums, config objects                        |
| config/       | statics/                   | Static configuration values                                    |
| enums/        | statics/                   | Enumerations                                                   |
| formatters/   | transformers/              | Data formatting                                                |
| mappers/      | transformers/              | Data mapping                                                   |
| converters/   | transformers/              | Data conversion                                                |

## Import Rules - What Can Import What

### Same-folder imports

Files within the same domain folder can import each other:

- `adapters/fs/fs-exists-sync-adapter.test.ts` -> `./fs-exists-sync-adapter`
- `contracts/user/user.stub.ts` -> `./user-contract`

### Cross-folder imports

Only entry files can be imported across domain folders:

- Entry files = files matching folder's suffix pattern (`-adapter.ts`, `-contract.ts`, `-broker.ts`, etc.)
- `guards/auth/auth-guard.ts` -> `../../contracts/user/user-contract` (entry file)
- `guards/auth/auth-guard.ts` -> `../../contracts/user/helper` NOT allowed (not entry file)

### Import hierarchy (top can import from bottom)

```
widgets/          # Can import: bindings, responders, brokers, state, transformers, guards, contracts, statics, errors
responders/       # Can import: brokers, state, transformers, guards, contracts, statics, errors
bindings/         # Can import: brokers, state, transformers, guards, contracts, statics, errors
brokers/          # Can import: adapters, middleware, state, transformers, guards, contracts, statics, errors
middleware/       # Can import: adapters, transformers, guards, contracts, statics, errors
adapters/         # Can import: transformers, guards, contracts, statics, errors
state/            # Can import: contracts, statics, errors
transformers/     # Can import: guards, contracts, statics, errors
guards/           # Can import: contracts, statics, errors
contracts/        # Can import: statics
statics/          # Can import: nothing (leaf node)
errors/           # Can import: statics
```

## File Suffixes by Folder

| Folder       | File Suffix        | Export Pattern                 | Example                              |
|--------------|--------------------|--------------------------------|--------------------------------------|
| statics      | `-statics.ts`      | `export const nameStatics`     | `user-statics.ts` -> `userStatics`   |
| contracts    | `-contract.ts`     | `export const nameContract`    | `user-contract.ts` -> `userContract` |
| guards       | `-guard.ts`        | `export const nameGuard`       | `has-permission-guard.ts`            |
| transformers | `-transformer.ts`  | `export const nameTransformer` | `format-date-transformer.ts`         |
| errors       | `-error.ts`        | `export class NameError`       | `validation-error.ts`                |
| flows        | `-flow.ts(x)`      | `export const NameFlow`        | `user-flow.tsx` -> `UserFlow`        |
| adapters     | `-adapter.ts`      | `export const nameAdapter`     | `axios-get-adapter.ts`               |
| middleware   | `-middleware.ts`   | `export const nameMiddleware`  | `http-telemetry-middleware.ts`       |
| brokers      | `-broker.ts`       | `export const nameBroker`      | `user-fetch-broker.ts`               |
| bindings     | `-binding.ts`      | `export const nameBinding`     | `use-user-data-binding.ts`           |
| state        | `-state.ts`        | `export const nameState`       | `user-cache-state.ts`                |
| responders   | `-responder.ts(x)` | `export const NameResponder`   | `user-get-responder.ts`              |
| widgets      | `-widget.tsx`      | `export const NameWidget`      | `user-card-widget.tsx`               |
| startup      | `start-*.ts(x)`    | `export const StartName`       | `start-server.ts` -> `StartServer`   |

## Naming Conventions Summary

- **Files**: Always kebab-case (e.g., `user-fetch-broker.ts`)
- **Exports**:
    - camelCase for arrow functions (e.g., `userFetchBroker`)
    - PascalCase for classes/components (e.g., `ValidationError`, `UserCardWidget`, `UserGetResponder`)
- **Types**: Always PascalCase (e.g., `User`, `UserId`, `EmailAddress`)

## Common File Patterns

### Implementation Files

```
domain-name/
  domain-name-{suffix}.ts       # Implementation
  domain-name-{suffix}.proxy.ts # Test proxy
  domain-name-{suffix}.test.ts  # Unit tests
```

### Contract Files

```
domain-name/
  domain-name-contract.ts       # Zod schema + type
  domain-name-contract.test.ts  # Contract tests
  domain-name.stub.ts           # Test stub factory
```

### Startup Files

```
startup/
  start-name.ts                 # Bootstrap logic
  start-name.proxy.ts           # Optional: complex setup
  start-name.integration.test.ts # Integration test (not .test.ts)
```

## Quick Decision Tree

**"Where does this code go?"**

1. Does it wrap an npm package? -> **adapters/**
2. Is it a boolean check? -> **guards/**
3. Does it transform data? -> **transformers/**
4. Is it a Zod schema/type? -> **contracts/**
5. Is it immutable config? -> **statics/**
6. Is it business logic? -> **brokers/**
7. Is it a React hook? -> **bindings/**
8. Is it UI/component? -> **widgets/**
9. Is it a route handler? -> **responders/**
10. Is it in-memory storage? -> **state/**
11. Is it app initialization? -> **startup/**

**"Should I create a new file or extend existing?"**

1. Search for existing domain files using the discover endpoint:
    -
    `curl -s http://localhost:${DUNGEONMASTER_PORT:-4737}/api/discover -X POST -H 'Content-Type: application/json' -d '{"type":"files","fileType":"broker","search":"user"}'`
    -
    `curl -s http://localhost:${DUNGEONMASTER_PORT:-4737}/api/discover -X POST -H 'Content-Type: application/json' -d '{"type":"files","path":"packages/eslint-plugin/src/guards"}'`
2. If exists:
    - **bindings/widgets/brokers**: Extend with options
    - **transformers**: Create new file for each output shape
3. If doesn't exist: Create new file

**"Can I use while/if statements?"**

- **while (true)** -> Use recursion instead
- **if/else** -> Normal conditionals are fine
- **for/forEach** -> Loops over collections are fine

**"How do I mock this in tests?"**

- Create colocated `.proxy.ts` file
- Proxy uses `jest.spyOn()` or `jest.fn()` to mock dependencies
- See testing-standards.md for full patterns