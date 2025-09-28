# @questmaestro/eslint-plugin

ESLint plugin enforcing QuestMaestro architecture standards with custom rules for Zod contracts, folder structure, and
type safety.

## Features

- **🚫 Ban Raw Primitives**: No raw `string`/`number` types - use Zod contracts instead
- **🏷️ Zod Branding Required**: All `z.string()` and `z.number()` must be `.brand()`ed
- **📁 Folder Structure**: Enforces QuestMaestro project folder standards
- **🔧 Type Safety**: Explicit return types on all exported functions
- **📋 Complete Configuration**: One config that enforces ALL architectural standards

## Installation

```bash
npm install --save-dev @questmaestro/eslint-plugin
```

**Peer Dependencies:**

- `eslint ^9.0.0` (flat config support)
- `@typescript-eslint/eslint-plugin ^8.0.0`
- `@typescript-eslint/parser ^8.0.0`
- `typescript ^5.0.0`

## Usage

### Complete Configuration (Recommended)

```javascript
// eslint.config.js
import questmaestro from '@questmaestro/eslint-plugin/config';

export default [questmaestro];
```

### Individual Rules

```javascript
// eslint.config.js
import questmaestroPlugin from '@questmaestro/eslint-plugin';

export default [
    {
        plugins: {
            '@questmaestro': questmaestroPlugin
        },
        rules: {
            '@questmaestro/ban-primitives': 'error',
            '@questmaestro/require-zod-on-primitives': 'error',
            '@questmaestro/explicit-return-types': 'error',
            '@questmaestro/enforce-folder-structure': 'error'
        }
    }
];
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "extends": "@questmaestro/eslint-plugin/tsconfig",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

## Rules

### `@questmaestro/ban-primitives`

Bans raw `string` and `number` types in favor of Zod contract types.

```typescript
// ❌ Bad
function getUser(id: string): User {
    // ...
}

// ✅ Good
function getUser(id: UserId): User {
    // ...
}
```

### `@questmaestro/require-zod-on-primitives`

Requires `.brand()` chaining on all `z.string()` and `z.number()` calls.

```typescript
// ❌ Bad
export const userIdContract = z.string().uuid();

// ✅ Good
export const userIdContract = z.string().uuid().brand<'UserId'>();
```

### `@questmaestro/explicit-return-types`

Requires explicit return types on all exported functions using Zod contracts.

```typescript
// ❌ Bad
export const getUserBroker = (id: UserId) => {
    return userContract.parse(data);
};

// ✅ Good
export const getUserBroker = (id: UserId): User => {
    return userContract.parse(data);
};
```

### `@questmaestro/enforce-folder-structure`

Enforces QuestMaestro project folder structure standards.

**Allowed folders:**

- `contracts/` - Zod schemas and validation
- `brokers/` - Business logic coordination
- `adapters/` - External service integration
- `transformers/` - Data transformation
- `flows/` - Multi-step processes
- `responders/` - Request/response handling
- `middleware/` - Request preprocessing
- `widgets/` - UI components
- `bindings/` - Framework integrations
- `state/` - State management
- `startup/` - Application initialization
- `errors/` - Error definitions
- `assets/` - Static resources
- `migrations/` - Database migrations

**Forbidden folders:**

- `utils/`, `lib/`, `helpers/` → Use `adapters/` or `transformers/`
- `services/`, `repositories/` → Use `brokers/`
- `models/`, `types/`, `interfaces/` → Use `contracts/`
- `common/`, `shared/` → Distribute by function

## TypeScript Configuration

The included TypeScript configuration enforces:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowUnreachableCode": false
  }
}
```

## Example Setup

### 1. Install Dependencies

```bash
npm install --save-dev @questmaestro/eslint-plugin eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser typescript
```

### 2. Configure ESLint

```javascript
// eslint.config.js
import questmaestro from '@questmaestro/eslint-plugin/config';

export default [
    questmaestro,
    {
        // Project-specific overrides
        ignores: ['dist/', 'node_modules/']
    }
];
```

### 3. Configure TypeScript

```json
// tsconfig.json
{
  "extends": "@questmaestro/eslint-plugin/tsconfig",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": [
    "src/**/*"
  ]
}
```

### 4. Package.json Scripts

```json
{
  "scripts": {
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "typecheck": "tsc --noEmit"
  }
}
```

## Architecture Philosophy

This plugin enforces the QuestMaestro architecture principles:

1. **Type Safety**: All data must be validated through Zod contracts
2. **Explicit Boundaries**: No raw primitives, everything must be branded
3. **Clear Structure**: Organized by function, not by technical layer
4. **Fail Fast**: Catch architectural violations at lint time

## Advanced Usage

### Custom Error Messages

The plugin provides detailed error messages with suggestions:

```
Raw string type is not allowed. Use Zod contract types like EmailAddress, UserName, FilePath, etc. instead.

z.string() must be chained with .brand() - use z.string().email().brand<'EmailAddress'>() instead of z.string().email()

Folder "utils/" is forbidden. Use "adapters or transformers/" instead according to project standards.
```

### Programmatic API

```typescript
import {
    banPrimitivesRuleBroker,
    questmaestroConfigBroker
} from '@questmaestro/eslint-plugin';

// Use individual rule brokers for custom configurations
const customConfig = {
    rules: {
        'custom/ban-primitives': banPrimitivesRuleBroker()
    }
};
```

## Migration

### From Existing Projects

1. Install the plugin and its peer dependencies
2. Start with individual rules to gradually adopt the standards
3. Fix violations incrementally using `--fix` where possible
4. Enable the complete configuration once violations are resolved

### From Other Linting Setups

The plugin is designed to work alongside existing ESLint configurations:

```javascript
// eslint.config.js
import questmaestro from '@questmaestro/eslint-plugin/config';
import prettier from 'eslint-config-prettier';

export default [
    questmaestro,
    prettier, // Disable conflicting rules
    {
        // Your custom overrides
    }
];
```

## License

MIT

## Contributing

This plugin is part of the QuestMaestro architecture standards. Issues and contributions should align with the overall
architectural philosophy of type safety, explicit boundaries, and clear structure.