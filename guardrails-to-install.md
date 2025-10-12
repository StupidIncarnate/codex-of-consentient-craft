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

## Some globals must be adapters

Fetch too so that we can force a proxy on it

## coverage
Dont let it run jest --coverage, because then it starts hallucination.

## while(true)

LLm likes to do this when file path searching. They need to use recursion instead

## Squirreling lists of strings

LLM seems to just place arrays of string const everywhere. We need a standard and probably a lint rule. ex

## add a rule for @types at same level as src

It can only store .d.ts files

## Forbid as and something:type

const toolInput: EditToolInput = editToolInputContract.parse({
file_path: '/test/file.txt',
old_string: 'test',
new_string: 'demo',
replace_all: true,
});

These should be linted against because of how we've structured the project

## Every file needs a comment at top explaining what it does

Thisll give llm more context on the file

## need a lint guard / warning looking for dup strings

LLM is still doing a lot of magic strings everywhere. We need a lint rule finding them and force them to get stored in
statics or something.

- Strings
- Regex

## Lint rules to stop it from declaring one off types/interfaces inside a function (or maybe in a file at all?):

```typescript
interface ExportInfo {
    type: string;
    name?: string;
    isTypeOnly: boolean;
}

const programNode = node as unknown as {
    body: {
        type: string;
        exportKind?: 'type' | 'value';
        declaration?: {
            type?: string;
            id?: { name?: string };
            declarations?: { id?: { type?: string; name?: string } }[];
        };
        specifiers?: unknown[];
        source?: { value?: string };
    }[];
}
```

## transformers need another layer.

LLM was making a is-structure-valid transformer and other generic ones, so we need a domain/subject nesting like brokers

## Need a lint rule that forbids inline functions in theyre not part of the return type.

Seeing this a lot in lint rules.

```typescript
create: (context: Rule.RuleContext) => {
    const {filename} = context;

    // PRE-VALIDATION: Exclude files from structure validation
    if (shouldExcludeFileFromProjectStructureRulesGuard({filename})) {
        return {};
    }

    // Extract project folder type (brokers, contracts, guards, etc.)
    const firstFolder = projectFolderTypeFromFilePathTransformer({filename});
    if (!firstFolder) {
        return {};
    }

    // Helper to check if string is kebab-case
    const isKebabCase = (str: string): boolean => /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u.test(str);

    // Helper to extract folder path segments from filename
    const getFolderSegments = (filePath: string): string[] => {
        const afterSrc = filePath.split('/src/')[1];
        if (!afterSrc) return [];
        const parts = afterSrc.split('/');
        return parts.slice(0, -1); // Remove filename, keep folders
    };
```

## allow inline imports only for file paths

      // eslint-disable-next-line @typescript-eslint/no-require-imports
        const config = require(configPath) as QuestmaestroHooksConfig;

That way they can be imported in a function. npm packages however must be excluded. Have to turn off this rule for now

```text
nly has certain keys, so I should validate against those:
⎿  Updated src/transformers/apply-overrides/apply-overrides-transformer.ts with 21 additions and 4
removals
1    import type { FrameworkPreset } from
'../../contracts/framework-presets/framework-presets';
2    import type { QuestmaestroConfig } from
'../../contracts/questmaestro-config/questmaestro-config-contract';
3
4 +  const isFrameworkPresetKey = (key: string): key is keyof FrameworkPreset => {
5 +    const validKeys: Array<keyof FrameworkPreset> = [
6 +      'widgets',
7 +      'bindings',
8 +      'state',
9 +      'flows',
10 +      'responders',
11 +      'contracts',
12 +      'brokers',
13 +      'transformers',
14 +      'errors',
15 +      'middleware',
16 +      'adapters',
17 +      'startup',
18 +    ];
19 +    return validKeys.includes(key as keyof FrameworkPreset);
20 +  };
21 +
22    export const applyOverridesTransformer = ({
23      preset,
24      config,
...
16
17      // Apply each override
18      for (const [folder, override] of Object.entries(config.architecture.overrides)) {
19 -      if (override.add) {
20 -        const folderKey = folder as keyof FrameworkPreset;
21 -        const currentValues = result[folderKey];
19 +      if (override.add && isFrameworkPresetKey(folder)) {
20 +        const currentValues = result[folder];
21
22          // Only add to folders that allow packages (not null)
23          if (Array.isArray(currentValues)) {
24 -          result[folderKey] = [...currentValues, ...override.add];
24 +          result[folder] = [...currentValues, ...override.add];
25          }
26        }
```

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
│ │ ├── schema-library-contract.ts // SchemaLibrary type - zod
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