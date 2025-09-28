# @questmaestro/eslint-plugin Implementation Plan

## Overview

This package provides ESLint custom rules and configurations for enforcing QuestMaestro architecture standards,
including Zod contract enforcement, folder structure validation, and TypeScript type safety.

## Package Structure

```
packages/eslint-plugin/
├── package.json                                      // NPM package definition
├── jest.config.js                                   // Jest test configuration
├── tsconfig.json                                    // Build configuration for package
├── src/
│   ├── contracts/
│   │   ├── eslint-rule/
│   │   │   └── eslint-rule-contract.ts              // Zod contract for ESLint rule structure
│   │   ├── eslint-config/
│   │   │   └── eslint-config-contract.ts            // Zod contract for ESLint flat config structure
│   │   ├── tsconfig-options/
│   │   │   └── tsconfig-options-contract.ts         // Zod contract for TSConfig compiler options
│   │   ├── ast-node/
│   │   │   └── ast-node-contract.ts                 // Zod contract for AST node structure
│   │   └── rule-violation/
│   │       └── rule-violation-contract.ts           // Zod contract for rule violation reports
│   ├── brokers/
│   │   ├── rule/
│   │   │   ├── ban-primitives/
│   │   │   │   └── ban-primitives-rule-broker.ts    // Creates ESLint rule that bans raw string/number types
│   │   │   ├── require-zod-on-primitives/
│   │   │   │   └── require-zod-on-primitives-rule-broker.ts // Creates ESLint rule requiring .brand() on z.string()/z.number()
│   │   │   ├── enforce-folder-structure/
│   │   │   │   └── enforce-folder-structure-rule-broker.ts  // Creates ESLint rule validating project folder structure
│   │   │   └── explicit-return-types/
│   │   │       └── explicit-return-types-rule-broker.ts     // Creates ESLint rule requiring explicit return types on exports
│   │   └── config/
│   │       ├── recommended/
│   │       │   └── recommended-config-broker.ts     // Creates recommended ESLint flat config with subset of rules
│   │       ├── strict/
│   │       │   └── strict-config-broker.ts          // Creates strict ESLint flat config with all rules enabled
│   │       └── tsconfig/
│   │           └── tsconfig-broker.ts               // Creates base TSConfig with strict compiler options
│   ├── transformers/
│   │   ├── merge-configs/
│   │   │   └── merge-configs-transformer.ts         // Merges multiple ESLint flat configs into one
│   │   ├── ast-to-violation/
│   │   │   └── ast-to-violation-transformer.ts      // Transforms AST node into rule violation report
│   │   └── rule-to-config/
│   │       └── rule-to-config-transformer.ts        // Transforms individual rule into ESLint config format
│   ├── startup/
│   │   └── start-eslint-plugin.ts                   // Main plugin export with all rules and configs
│   └── index.ts                                     // Public API exports
├── configs/
│   ├── tsconfig.json                               // Extendable base TSConfig with strict settings
│   ├── eslint.recommended.js                       // Flat config with recommended rules + existing TypeScript rules
│   └── eslint.strict.js                           // Flat config with all custom rules + strict existing rules
└── README.md                                       // Usage documentation
```

## Package Configuration

### package.json Exports

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./tsconfig": "./configs/tsconfig.json",
    "./recommended": "./configs/eslint.recommended.js",
    "./strict": "./configs/eslint.strict.js"
  }
}
```

### Peer Dependencies

- `eslint ^9.0.0` (flat config support)
- `@typescript-eslint/eslint-plugin ^8.0.0`
- `@typescript-eslint/parser ^8.0.0`
- `typescript ^5.0.0`

## Custom Rules Implementation

### 1. ban-primitives Rule

- **Purpose**: Bans raw `string` and `number` types in TypeScript
- **Message**: "Use Zod contract types like EmailAddress, UserId instead of raw primitives"
- **Targets**: `TSStringKeyword`, `TSNumberKeyword` AST nodes

### 2. require-zod-on-primitives Rule

- **Purpose**: Requires `.brand()` chaining on `z.string()` and `z.number()` calls
- **Message**: "z.string() must be chained with .brand() - use z.string().email().brand<'EmailAddress'>()"
- **Targets**: CallExpression nodes for Zod methods

### 3. enforce-folder-structure Rule

- **Purpose**: Validates files are in correct folders per project standards
- **Message**: "File should be in [correct-folder]/ based on project standards"
- **Targets**: File imports and module resolution

### 4. explicit-return-types Rule

- **Purpose**: Requires explicit return types on exported functions
- **Message**: "Exported functions must have explicit return types using Zod contracts"
- **Targets**: Exported function declarations and expressions

## Usage Examples

### Basic Plugin Usage

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
            '@questmaestro/require-zod-on-primitives': 'error'
        }
    }
];
```

### Recommended Configuration

```javascript
// eslint.config.js
import questmaestroRecommended from '@questmaestro/eslint-plugin/recommended';

export default [questmaestroRecommended];
```

### TSConfig Extension

```json
// tsconfig.json
{
  "extends": "@questmaestro/eslint-plugin/tsconfig",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

### Individual Rule Usage

```javascript
// eslint.config.js
import questmaestroPlugin from '@questmaestro/eslint-plugin';

export default [
    {
        plugins: {'@questmaestro': questmaestroPlugin},
        rules: {
            '@questmaestro/ban-primitives': 'error'
            // Other rules disabled
        }
    }
];
```

## Implementation Phases

### Phase 1: Foundation

1. Create contracts for ESLint rule structure and AST nodes
2. Implement basic rule broker for ban-primitives
3. Create basic recommended config broker
4. Set up plugin entry point and exports

### Phase 2: Core Rules

1. Implement require-zod-on-primitives rule broker
2. Implement explicit-return-types rule broker
3. Create strict config broker with all rules
4. Add comprehensive test coverage

### Phase 3: Advanced Features

1. Implement enforce-folder-structure rule broker
2. Add transformers for config merging and AST processing
3. Create flat config exports (eslint.recommended.js, eslint.strict.js)
4. Add CLI utilities for rule testing

### Phase 4: Documentation & Polish

1. Write comprehensive README with examples
2. Add JSDoc comments to all public APIs
3. Create migration guide from existing setups
4. Performance optimization and rule caching

## Testing Strategy

### Unit Tests

- Each rule broker has dedicated test file
- Mock AST nodes using test factories
- Test all rule violation scenarios
- Validate rule metadata and configuration

### Integration Tests

- Test complete plugin loading and configuration
- Verify flat config exports work correctly
- Test TSConfig extension functionality
- End-to-end rule execution in real projects

### Test Structure

```
src/brokers/rule/ban-primitives/ban-primitives-rule-broker.test.ts
src/brokers/config/recommended/recommended-config-broker.test.ts
src/transformers/merge-configs/merge-configs-transformer.test.ts
```

## Dependencies

### Runtime Dependencies

- `zod ^3.25.76` - Contract validation

### Development Dependencies

- `@questmaestro/testing` - Test utilities
- `@types/eslint ^9.0.0` - ESLint type definitions
- Standard TypeScript/Jest/ESLint toolchain

## Publishing

### Package Publishing

- Automatic versioning via changesets
- Published to npm with `@questmaestro` scope
- Public access for open source usage

### Release Process

1. Build TypeScript to `dist/` directory
2. Include `configs/` directory in published package
3. Verify all exports are accessible
4. Test in external project before publishing

## Future Enhancements

### Additional Rules

- Function parameter object destructuring validation
- Import/export structure enforcement
- Async/await pattern validation
- Error handling consistency

### Tooling Integration

- VS Code extension for real-time feedback
- CLI tool for architecture validation
- Git hooks for pre-commit validation
- CI/CD integration examples

## Migration from Existing Setup

### From packages/lint/ Documentation

1. Extract rule specifications from markdown files
2. Convert ESLint selector patterns to rule implementations
3. Migrate TSConfig recommendations to configs/tsconfig.json
4. Update project documentation to reference new package

### Breaking Changes

- Flat config requirement (ESLint v9+)
- Package name change from potential `@questmaestro/lint`
- TypeScript version requirement (5.0+)
- Peer dependency requirements