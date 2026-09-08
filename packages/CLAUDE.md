# Monorepo Packages Structure

This directory contains all workspace packages for the Dungeonmaster monorepo.

## Creating New Packages

Run the command. It writes every config the package type needs, registers the package in the root
`package.json`, and seeds `src/` so the package-type detector recognises what it is:

```bash
dungeonmaster create-package --name <name> --type <packageType>
```

Run it with no arguments to be prompted instead; `--dry-run` prints the plan and writes nothing.

**Do not hand-copy the configs off a sibling.** No two jest configs in this repo are alike — three
packages use `jest.config.cjs` rather than `.js` — and a copy reliably loses the `exclude` entries
that keep `.stub.ts` and `.harness.ts` out of `dist`, along with the `incremental` and
`tsBuildInfoFile` pair every `build:clean` deletes.

### What the two tsconfigs are for

`tsconfig.json` is the CHECKING config, and what ward's per-package `tsc --noEmit` runs. It emits
nothing, so concurrent scoped ward runs never corrupt each other's output.

`tsconfig.build.json` is the EMITTING config, what `npm run build` runs, and the only thing that
writes `dist/`. Its `exclude` list is what keeps test, proxy, stub and harness files out of the
package's published output.

`web` is the one package with no build config: it builds through `vite build`, and
`build-workspaces.mjs` keys on that file's absence to decide which packages `tsc` handles.

### Depending on another workspace package

Add it to `dependencies` as `"@dungeonmaster/shared": "*"`.

**Remember:** `@dungeonmaster/shared`'s package.json exports a `source` condition on every subpath, so ward's
typecheck, unit and integration checks (which set `--conditions=source`) read edited contracts directly —
no rebuild needed for those. Every runtime path that does not set that condition (`npm run prod`,
`dungeonmaster start` in a consumer, the MCP server, `npm run build` itself) still resolves
`@dungeonmaster/shared` through `dist/`, so rebuild it before exercising any of those:

```bash
npm run build --workspace=@dungeonmaster/shared
```

**Lint is a narrow special case, not a member of that list.** The files ESLint CHECKS resolve to source like
every other check. What reads `dist/` is one import inside this repo's own lint rules: `eslint.config.js` loads
them from TypeScript source, but they `import { locationsStatics } from '@dungeonmaster/shared/statics'` at
module load, and ESLint sets no `source` condition. So rebuild `shared` before lint only when you changed a
statics value a custom rule reads.

### Jest configuration

Every package spreads the REPO-ROOT `jest.config.base.js`. That base carries the ts-jest AST
transformers `registerMock` and the proxy files depend on, the auto-reset setup that clears mocks
between tests, and `testEnvironmentOptions.customExportConditions`. **Inherit that last one; never
pin your own `testEnvironmentOptions`** — the conditions list is what makes a test resolve a sibling
workspace package to the TypeScript a session just edited rather than to `dist/`, and a suite that
loses it grades the last build and goes green over changed source.

Beyond the base, each package's config differs by what it tests: JSX packages override the preset and
transform, `mcp` maps `.js` imports back to `.ts`, `web` resolves React to a single instance. The
command writes the right one per package type.

### Running checks

Use `npm run ward` — this package's own script, or the root command scoped to this package. Never
invoke `tsc`, `eslint` or `jest` directly. ESLint discovers files from the root `eslint.config.js`,
so it needs no arguments.

### Why root registration matters

The command adds the package to the root `package.json` `dependencies`, and that field is what ships.
`workspaces` only affects local symlinking, so a package missing from `dependencies` is not installed
for anyone who runs `npm install dungeonmaster`.

## Type Definitions

**Root `@types/` folder:** Type definitions for packages without `@types` npm packages should be placed in the root
`@types/` directory, NOT in individual packages. Packages access these types via the `typeRoots` configuration in their
`tsconfig.json`.

Example: `@types/eslint-plugin-eslint-comments/index.d.ts`

**IMPORTANT:** When creating type definitions:

1. Place them in `@types/package-name/index.d.ts` at the monorepo root
2. Export interfaces/types that need to be imported by using `export` keyword
3. Each package's `tsconfig.json` must include `typeRoots` pointing to `../../@types`

```typescript
// Example: @types/eslint-plugin-eslint-comments/index.d.ts
declare module 'eslint-plugin-eslint-comments' {
    import type {Linter} from 'eslint';

    export interface EslintCommentsPlugin {
        rules: Record<string, unknown>;
        configs?: Record<string, Linter.Config>;
    }

    const plugin: EslintCommentsPlugin;
    export default plugin;
}
```

## Common Issues

### TypeScript error: "has or is using name from external module but cannot be named"

**Cause:** Package tsconfig.json is missing `typeRoots` configuration, or the type definition doesn't export the
interface.

**Fix:**

1. Ensure package's `tsconfig.json` includes:
   ```json
   "typeRoots": ["../../node_modules/@types", "../../@types"]
   ```
2. Ensure the type definition exports the interface with `export` keyword
3. Import the type as a named import in your code

### Lint fails with "Could not find a declaration file for module"

**Cause:** Package tsconfig.json doesn't extend root tsconfig or is missing typeRoots.

**Fix:**

1. Ensure `"extends": "../../tsconfig.json"` is in your package's tsconfig.json
2. Add `typeRoots` configuration pointing to `../../@types`

### Package can't import from @dungeonmaster/shared

**Cause:** Either:

1. Missing dependency in package.json
2. `@dungeonmaster/shared` not built after contract changes

**Fix:**

1. Add `"@dungeonmaster/shared": "*"` to dependencies
2. Run `npm run build --workspace=@dungeonmaster/shared`
3. Run `npm install` to link workspace packages
