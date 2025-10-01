## Overview
Keeping track of what project guardrails are in place to force claude to do things properly and not skip steps.

## jest.setup.js
Claude was filling in empty tests, doing feature work, filled in a few, and then ran test and saw everything passed, even the empty tests and moved on.

This ensures it sees failures for empty tests: 

```tsx

afterEach(() => {
    // Restore real timers after each test
    jest.useRealTimers();

    // Check for empty tests (tests without assertions)
    const currentTest = expect.getState().currentTestName;
    const assertionsMade = expect.getState().assertionCalls;

    if (assertionsMade === 0) {
        throw new Error(`Test "${currentTest}" has no assertions. Add expect() calls or remove the test.`);
    }
});

```

## console outputs in tests
If claude console logs in files, they will bleed through tests and clog the display, which will lead to false positives of passing vs not.

Similarly, if a console log in script says something happened without verification, it can lead claude to assume it worked and not double-check things.

Console.logs need to be tailored and forbidden in most places.

## clearAllMocks

This needs to be setup in globals and a lint rule/prehook forbidding it

## forbid
jest.clearAllMocks(); - Tell claude its handled in jest.config

Exported jest config (or ones made in external repo needs a jest setup function file to add to a project's jest config)

## inline imports

Claude does a lot of inline imports. Needs line/hook blocker
config?: import('../types/config-type').PreEditLintConfig;

## coverage
Dont let it run jest --coverage, because then it starts hallucination.

## while(true)

LLm likes to do this when file path searching. They need to use recursion instead

## PLanning

Getting clade to make a plan and list out entire folder structure with comments for each file is really helpful for
getting it to generate properly.


packages/config/
├── package.json // NPM package definition for @questmaestro/config
├── index.ts // Thin entry point: export * from './src/startup/start-config-library'
├── tsconfig.json // TypeScript compiler configuration
├── jest.config.js // Jest test runner configuration
├── IMPLEMENTATION-PLAN.md // This plan document for reference across sessions
└── src/
├── contracts/ // Type definitions, validation schemas, and static data
│ ├── framework/ // Framework type and validation
│ │ ├── framework-contract.ts // Framework enum type (react, vue, express, etc.)
│ │ └── framework-contract.test.ts // Tests for framework validation
│ ├── framework-presets/ // Static preset configurations for each framework
│ │ ├── framework-presets.ts // All preset definitions (what packages each framework allows)
│ │ └── framework-presets.test.ts // Tests for preset data structure
│ ├── schema-library/ // Validation library types
│ │ ├── schema-library-contract.ts // SchemaLibrary type (zod, yup, joi, etc.)
│ │ └── schema-library-contract.test.ts // Tests for schema library validation
│ ├── routing-library/ // Router library types
│ │ ├── routing-library-contract.ts // RoutingLibrary type (react-router-dom, vue-router, etc.)
│ │ └── routing-library-contract.test.ts // Tests for routing library validation
│ ├── questmaestro-config/ // Main configuration type
│ │ ├── questmaestro-config-contract.ts // QuestmaestroConfig type and validation schema
│ │ └── questmaestro-config-contract.test.ts // Tests for config validation
│ └── folder-config/ // Computed configuration types
│ ├── folder-config-contract.ts // AllowedExternalImports type for lint rules
│ └── folder-config-contract.test.ts // Tests for folder config structure
│
├── transformers/ // Pure functions that transform configuration data
│ ├── compute-allowed-imports/ // Main config computation
│ │ ├── compute-allowed-imports-transformer.ts // Transform user config + preset into allowed imports
│ │ └── compute-allowed-imports-transformer.test.ts // Tests for computation logic
│ ├── apply-overrides/ // Override application
│ │ ├── apply-overrides-transformer.ts // Apply user overrides to preset config
│ │ └── apply-overrides-transformer.test.ts // Tests for override logic
│ └── merge-configs/ // Config merging
│ ├── merge-configs-transformer.ts // Merge monorepo root + package configs
│ └── merge-configs-transformer.test.ts // Tests for merge logic
│
├── brokers/ // Business logic for config operations
│ ├── config-file/ // Operations on .questmaestro files
│ │ ├── load/ // Loading config files
│ │ │ ├── config-file-load-broker.ts // Load and parse .questmaestro file content
│ │ │ └── config-file-load-broker.test.ts // Tests for config loading
│ │ └── find/ // Finding config files
│ │ ├── config-file-find-broker.ts // Walk up directory tree to find .questmaestro files
│ │ └── config-file-find-broker.test.ts // Tests for config finding logic
│ └── config/ // High-level config operations
│ └── resolve/ // Config resolution
│ ├── config-resolve-broker.ts // Orchestrate finding, loading, merging all configs
│ └── config-resolve-broker.test.ts // Tests for resolution orchestration
│
├── adapters/ // Wrappers for external packages (fs, path)
│ ├── fs/ // File system operations
│ │ ├── fs-read-file.ts // Wrapper for fs.readFile with error handling
│ │ └── fs-read-file.test.ts // Tests for file reading
│ └── path/ // Path operations
│ ├── path-resolve.ts // Wrapper for path.resolve and path.dirname
│ └── path-resolve.test.ts // Tests for path operations
│
├── errors/ // Custom error classes for clear debugging
│ ├── invalid-framework/ // Framework validation errors
│ │ ├── invalid-framework-error.ts // Error thrown for unknown framework values
│ │ └── invalid-framework-error.test.ts // Tests for framework error
│ ├── invalid-config/ // Config validation errors
│ │ ├── invalid-config-error.ts // Error thrown for malformed config structure
│ │ └── invalid-config-error.test.ts // Tests for config error
│ └── config-not-found/ // Missing config errors
│ ├── config-not-found-error.ts // Error thrown when no .questmaestro found
│ └── config-not-found-error.test.ts // Tests for not found error
│
└── startup/ // Library entry point and API composition
├── start-config-library.ts // Public API exports for ESLint and other consumers
└── start-config-library.test.ts // Integration tests for public API