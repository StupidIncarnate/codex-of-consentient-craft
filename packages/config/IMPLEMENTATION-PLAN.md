# Implementation Plan for @questmaestro/config Library

## Final Package Structure

```
packages/config/
├── package.json                                      // NPM package definition for @questmaestro/config
├── index.ts                                          // Thin entry point: export * from './src/startup/start-config-library'
├── tsconfig.json                                     // TypeScript compiler configuration
├── jest.config.js                                    // Jest test runner configuration
├── IMPLEMENTATION-PLAN.md                            // This plan document for reference across sessions
└── src/
    ├── contracts/                                    // Type definitions, validation schemas, and static data
    │   ├── framework/                                // Framework type and validation
    │   │   ├── framework-contract.ts                 // Framework enum type (react, vue, express, etc.)
    │   │   └── framework-contract.test.ts            // Tests for framework validation
    │   ├── framework-presets/                        // Static preset configurations for each framework
    │   │   ├── framework-presets.ts                  // All preset definitions (what packages each framework allows)
    │   │   └── framework-presets.test.ts             // Tests for preset data structure
    │   ├── schema-library/                           // Validation library types
    │   │   ├── schema-library-contract.ts            // SchemaLibrary type (zod)
    │   │   └── schema-library-contract.test.ts       // Tests for schema library validation
    │   ├── routing-library/                          // Router library types
    │   │   ├── routing-library-contract.ts           // RoutingLibrary type (react-router-dom, vue-router, etc.)
    │   │   └── routing-library-contract.test.ts      // Tests for routing library validation
    │   ├── questmaestro-config/                      // Main configuration type
    │   │   ├── questmaestro-config-contract.ts       // QuestmaestroConfig type and validation schema
    │   │   └── questmaestro-config-contract.test.ts  // Tests for config validation
    │   └── folder-config/                            // Computed configuration types
    │       ├── folder-config-contract.ts             // AllowedExternalImports type for lint rules
    │       └── folder-config-contract.test.ts        // Tests for folder config structure
    │
    ├── transformers/                                  // Pure functions that transform configuration data
    │   ├── compute-allowed-imports/                  // Main config computation
    │   │   ├── compute-allowed-imports-transformer.ts     // Transform user config + preset into allowed imports
    │   │   └── compute-allowed-imports-transformer.test.ts // Tests for computation logic
    │   ├── apply-overrides/                          // Override application
    │   │   ├── apply-overrides-transformer.ts        // Apply user overrides to preset config
    │   │   └── apply-overrides-transformer.test.ts   // Tests for override logic
    │   └── merge-configs/                            // Config merging
    │       ├── merge-configs-transformer.ts          // Merge monorepo root + package configs
    │       └── merge-configs-transformer.test.ts     // Tests for merge logic
    │
    ├── brokers/                                       // Business logic for config operations
    │   ├── config-file/                              // Operations on .questmaestro files
    │   │   ├── load/                                  // Loading config files
    │   │   │   ├── config-file-load-broker.ts        // Load and parse .questmaestro file content
    │   │   │   └── config-file-load-broker.test.ts   // Tests for config loading
    │   │   └── find/                                  // Finding config files
    │   │       ├── config-file-find-broker.ts        // Walk up directory tree to find .questmaestro files
    │   │       └── config-file-find-broker.test.ts   // Tests for config finding logic
    │   └── config/                                    // High-level config operations
    │       └── resolve/                               // Config resolution
    │           ├── config-resolve-broker.ts          // Orchestrate finding, loading, merging all configs
    │           └── config-resolve-broker.test.ts     // Tests for resolution orchestration
    │
    ├── adapters/                                      // Wrappers for external packages (fs, path)
    │   ├── fs/                                        // File system operations
    │   │   ├── fs-read-file.ts                       // Wrapper for fs.readFile with error handling
    │   │   └── fs-read-file.test.ts                  // Tests for file reading
    │   └── path/                                      // Path operations
    │       ├── path-resolve.ts                       // Wrapper for path.resolve and path.dirname
    │       └── path-resolve.test.ts                  // Tests for path operations
    │
    ├── errors/                                        // Custom error classes for clear debugging
    │   ├── invalid-framework/                        // Framework validation errors
    │   │   ├── invalid-framework-error.ts            // Error thrown for unknown framework values
    │   │   └── invalid-framework-error.test.ts       // Tests for framework error
    │   ├── invalid-config/                           // Config validation errors
    │   │   ├── invalid-config-error.ts               // Error thrown for malformed config structure
    │   │   └── invalid-config-error.test.ts          // Tests for config error
    │   └── config-not-found/                         // Missing config errors
    │       ├── config-not-found-error.ts             // Error thrown when no .questmaestro found
    │       └── config-not-found-error.test.ts        // Tests for not found error
    │
    └── startup/                                       // Library entry point and API composition
        ├── start-config-library.ts                   // Public API exports for ESLint and other consumers
        └── start-config-library.test.ts              // Integration tests for public API
```

## Implementation Steps

### 1. Package Setup ✅

- Create package.json with proper dependencies
- Configure TypeScript and Jest
- Set up build scripts
- Save this plan to IMPLEMENTATION-PLAN.md

### 2. Type Definitions (contracts/)

- Define all types from configset.md
- Create validation schemas
- Define static framework preset data

### 3. File Operations (brokers/ + adapters/)

- Implement .questmaestro file finding (walk up directory tree)
- Implement config file loading and parsing
- Handle monorepo config merging

### 4. Transformation Logic (transformers/)

- Compute allowed imports from framework + config
- Apply user overrides
- Merge monorepo configs properly

### 5. Error Handling (errors/)

- Clear error messages for debugging

### 6. Public API (startup/)

- `resolveConfigForFile({filePath})` - Main entry for ESLint
- `getFrameworkPreset({framework})` - Get preset data
- `validateConfig({config})` - Validate config objects
- `getAllFrameworks()` - List valid frameworks

### 7. Comprehensive Tests

- Test every framework preset
- Test config finding/loading
- Test override logic
- Test monorepo merging
- 100% branch coverage

## Key Features

- Stateless library (no runtime state)
- Reads .questmaestro files from filesystem
- Walks up directory tree to find configs
- Merges monorepo configs correctly
- Returns computed config for ESLint rules to use
- Pure functions throughout
- Strict TypeScript (no any)

## Current Status

- ✅ Package setup complete
- 📋 Ready to implement type definitions