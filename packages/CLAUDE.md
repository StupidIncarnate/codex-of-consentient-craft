# Monorepo Packages Structure

This directory contains all workspace packages for the Questmaestro monorepo.

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
    "noEmit": false
  },
  "include": [
    "src/**/*",
    "*.ts"
  ]
}
```

**Why:** This ensures:

- Type definitions from root `@types/` folder are available
- Consistent compiler settings across all packages
- Proper module resolution for workspace dependencies

### 2. Package Dependencies

If your package uses `@questmaestro/shared` or other workspace packages, add them to dependencies:

```json
{
  "dependencies": {
    "@questmaestro/shared": "*"
  }
}
```

**Remember:** After modifying contracts in `@questmaestro/shared`, you MUST rebuild it:

```bash
npm run build --workspace=@questmaestro/shared
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
- `setupFilesAfterEnv` points to `@questmaestro/testing` which automatically resets/clears/restores Jest mocks globally
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
`@types/` directory, NOT in individual packages. This is inherited by all packages via the root tsconfig.

Example: `@types/eslint-plugin-eslint-comments.d.ts`

## Common Issues

### Lint fails with "Could not find a declaration file for module"

**Cause:** Package tsconfig.json doesn't extend root tsconfig.

**Fix:** Ensure `"extends": "../../tsconfig.json"` is in your package's tsconfig.json.

### Package can't import from @questmaestro/shared

**Cause:** Either:

1. Missing dependency in package.json
2. `@questmaestro/shared` not built after contract changes

**Fix:**

1. Add `"@questmaestro/shared": "*"` to dependencies
2. Run `npm run build --workspace=@questmaestro/shared`
3. Run `npm install` to link workspace packages
