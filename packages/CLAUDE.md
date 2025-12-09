# Monorepo Packages Structure

This directory contains all workspace packages for the Dungeonmaster monorepo.

## Creating New Packages

When creating a new package in this monorepo, you MUST configure the following:

### 1. Package tsconfig.json

**REQUIRED:** Every package must have a `tsconfig.json` that extends the root configuration:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declarationMap": true,
    "declaration": true,
    "noEmit": false,
    "typeRoots": [
      "../../node_modules/@types",
      "../../@types"
    ]
  },
  "include": [
    "src/**/*",
    "*.ts"
  ]
}
```

**Why:** This ensures:

- Type definitions from root `@types/` folder are available to the package
- Consistent compiler settings across all packages
- Proper module resolution for workspace dependencies
- TypeScript can find custom type definitions in the root `@types/` directory

### 2. Package Dependencies

If your package uses `@dungeonmaster/shared` or other workspace packages, add them to dependencies:

```json
{
  "dependencies": {
    "@dungeonmaster/shared": "*"
  }
}
```

**Remember:** After modifying contracts in `@dungeonmaster/shared`, you MUST rebuild it:

```bash
npm run build --workspace=@dungeonmaster/shared
```

### 3. Jest Configuration

**REQUIRED:** Every package must have a `jest.config.js` that extends the base configuration:

```javascript
// Extend shared Jest configuration
const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  // Override setupFilesAfterEnv to use correct relative path from this package
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
};
```

**Why:**

- Extends base Jest config for consistent test environment
- `setupFilesAfterEnv` points to `@dungeonmaster/testing` which automatically resets/clears/restores Jest mocks globally
- No need to manually add `jest.clearAllMocks()` in individual test files

### 4. Scripts

Standard scripts for consistency across packages:

```json
{
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint"
  }
}
```

**Note:** ESLint automatically discovers files based on root `eslint.config.js` - no arguments needed.

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
