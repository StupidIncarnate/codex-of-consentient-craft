# ESLint Rules for Universal Terminology Enforcement

This document defines all lint rules that enforce the universal terminology standards. These rules prevent structural
violations and maintain code organization according to our universal terms.

## Core File Organization Rules

```javascript
{
    // One export per file
    'max-exports'
:
    ['error', {
        max: 1,
        message: 'Each file must export exactly one function, class, or component'
    }],

        // No index files
        'no-index-files'
:
    ['error', {
        message: 'Use folder-name/folder-name.ts pattern instead of index files',
        pattern: '**/index.(ts|tsx|js|jsx)',
        severity: 'error'
    }],

        // Folder name must match main file
        'folder-name-pattern'
:
    ['error', {
        pattern: '**/*/',
        requires: '[folder-name]/[folder-name].(ts|tsx)',
        examples: {
            valid: [
                'user-fetch/user-fetch.ts',
                'UserCard/UserCard.tsx',
                'user-profile-page/user-profile-page.tsx',
                'format-date/format-date.ts'
            ],
            invalid: [
                'user-fetch/index.ts',        // ❌ No index files
                'user-fetch/main.ts',         // ❌ Must match folder name
                'UserCard/UserCardComponent.tsx' // ❌ Must be UserCard.tsx
            ]
        }
    }],

        // Require folder-per-thing
        'require-folder-structure'
:
    ['error', {
        message: 'Meaningful units must be in their own folder',
        disallow: [
            'src/*.ts',     // ❌ No loose files in src/
            'src/*.tsx',    // ❌ Must be in folders
            'types/*.ts',   // ❌ Must be in subfolders
            'widgets/*.tsx' // ❌ Must be in subfolders
        ]
    }]
}
```

## Universal Terms Enforcement

```javascript
{
    // Only allow universal terminology folders
    'allowed-folders'
:
    ['error', {
        allowedFolders: [
            'types',
            'schemas',
            'transformers',
            'errors',
            'flows',
            'adapters',
            'brokers',
            'bindings',
            'triggers',
            'state',
            'responders',
            'widgets',
            'assets',
            'migrations',
            'startup'
        ],
        message: 'Folder name not in universal terms. No utils/, services/, controllers/, etc.',
        pattern: 'src/**/*',
        forbiddenFolders: [
            'utils',      // ❌ Use transformers/
            'helpers',    // ❌ Use transformers/
            'services',   // ❌ Use adapters/
            'lib',        // ❌ Use adapters/
            'controllers',// ❌ Use responders/
            'models',     // ❌ Use types/
            'repositories',// ❌ Use brokers/
            'api',        // ❌ Use brokers/
            'hooks',      // ❌ Use bindings/
            'components', // ❌ Use widgets/
            'pages',      // ❌ Use responders/
            'routes',     // ❌ Use flows/
            'core',       // ❌ Distribute to appropriate terms
            'common',     // ❌ Distribute to appropriate terms
            'shared',     // ❌ Distribute to appropriate terms
            'config'      // ❌ Use state/ or startup/
        ]
    }]
}
```

## Folder-Specific Pattern Enforcement

```javascript
{
    'universal-term-patterns'
:
    ['error', {
        rules: {
            // Types - pure type definitions only
            'types/**/*.ts': {
                canOnlyExport: ['type', 'interface', 'enum'],
                cannotContain: ['function', 'class', 'const (unless enum)'],
                canOnlyImportFrom: [],  // No imports allowed
                exportPattern: /^[A-Z][a-zA-Z]*Type$/
            },

            // Schemas - runtime validation
            'schemas/**/*.ts': {
                mustImportOneOf: ['zod', 'yup', 'joi', '@sinclair/typebox'],
                canOnlyImportFrom: ['../types/**', '../errors/**'],
                exportPattern: /^[a-z][a-zA-Z]*Schema$|^validate[A-Z]|^is[A-Z]/,
                mustExport: ['parse', 'validate', 'safeParse']
            },

            // Transformers - pure functions
            'transformers/**/*.ts': {
                canOnlyImportFrom: ['../types/**'],
                mustBePure: true,
                noSideEffects: true,
                exportPattern: /^(format|transform|convert|map|to|from)/
            },

            // Errors - error classes
            'errors/**/*.ts': {
                canOnlyImportFrom: ['../types/**'],
                exportPattern: /.*Error$/,
                mustExtend: 'Error',
                mustHaveProperty: 'message'
            },

            // Flows - routing only
            'flows/**/*.tsx': {
                frontend: {
                    mustImport: ['react-router-dom'],
                    mustUse: ['Route', 'Routes'],
                    canOnlyImportFrom: ['../responders/**']
                }
            },
            'flows/**/*.ts': {
                backend: {
                    mustImport: ['express'],
                    mustCall: ['router.get', 'router.post', 'router.put', 'router.delete'],
                    canOnlyImportFrom: ['../responders/**']
                }
            },

            // Adapters - external package wrappers
            'adapters/**/*.ts': {
                structure: 'adapters/[package]/[function]/[function].ts',
                onePackagePerFolder: true,
                canOnlyImportFrom: ['node_modules/*'],
                cannotImportFrom: ['../flows/**', '../widgets/**', '../triggers/**'],
                examples: [
                    'adapters/axios/get/get.ts',
                    'adapters/mongoose/connect/connect.ts'
                ]
            },

            // Brokers - atomic operations
            'brokers/**/*.ts': {
                canOnlyImportFrom: ['../adapters/**', '../types/**', '../errors/**', '../schemas/**'],
                cannotCallOtherBrokers: true,
                cannotCallTriggers: true,
                mustBeAtomic: true,
                exportPattern: /^[a-z][a-zA-Z]*/
            },

            // Bindings - React hooks
            'bindings/**/*.ts': {
                frontend: {
                    mustImport: ['react'],
                    exportPattern: /^use[A-Z][a-zA-Z]*$/,
                    mustUseOneOf: ['useState', 'useEffect', 'useMemo', 'useCallback', 'useContext', 'useReducer'],
                    canOnlyImportFrom: ['../brokers/**', '../state/**']
                },
                cli: {
                    mustUseOneOf: ['fs.watch', 'process.on', 'chokidar'],
                    canOnlyImportFrom: ['../brokers/**', '../state/**']
                }
            },

            // Triggers - orchestration
            'triggers/**/*.ts': {
                cannotUseReactHooks: true,
                canCallMultipleBrokers: true,
                canOnlyImportFrom: ['../brokers/**', '../schemas/**'],
                cannotCallOtherTriggers: true,
                cannotCallBindings: true,
                mustBeAsync: true,
                exportPattern: /^[a-z][a-zA-Z]*Flow$|^[a-z][a-zA-Z]*Process$/
            },

            // State - pure storage
            'state/**/*.ts': {
                canOnlyImportFrom: ['../types/**', '../errors/**'],
                noSideEffects: true,
                noExternalCalls: true,
                mustManageLifecycle: ['storage', 'retrieval', 'cleanup']
            },

            // Responders - route handlers
            'responders/**/*.tsx': {
                frontend: {
                    mustImport: ['react'],
                    mustReturn: 'JSX.Element',
                    exportPattern: /Page$|Section$/,
                    canOnlyBeImportedBy: ['../flows/**']
                }
            },
            'responders/**/*.ts': {
                backend: {
                    signature: '(req: Request, res: Response) => Promise<void>',
                    mustCall: ['res.json', 'res.send', 'res.status'],
                    exportPattern: /Controller$/,
                    canOnlyBeImportedBy: ['../flows/**', '../startup/**']
                }
            },

            // Widgets - UI components
            'widgets/**/*.tsx': {
                mustImport: ['react'],
                mustReturn: 'JSX.Element',
                exportPattern: /^[A-Z][a-zA-Z]*$/,
                canOnlyImportFrom: ['../bindings/**', '../triggers/**', '../state/**', '../types/**', '../transformers/**'],
                cannotImportFrom: ['../brokers/**', '../adapters/**', '../flows/**', '../responders/**']
            },

            // Assets - static files
            'assets/**/*': {
                noExecutableCode: true,
                allowedExtensions: ['.css', '.scss', '.png', '.jpg', '.svg', '.json', '.html', '.md'],
                cannotContain: ['.ts', '.tsx', '.js', '.jsx']
            },

            // Migrations - version upgrades
            'migrations/**/*.ts': {
                mustBeIdempotent: true,
                filePattern: /^\d{3}-[a-z-]+\.ts$|^\d{4}-\d{2}-\d{2}-[a-z-]+\.ts$/,
                mustExport: ['up', 'down'],
                exportSignature: '() => Promise<void>',
                canOnlyImportFrom: ['../types/**', '../schemas/**', '../transformers/**']
            },

            // Startup - bootstrap
            'startup/**/*.ts': {
                canImportFromAnywhere: true,
                shouldHandle: ['initialization', 'shutdown', 'cleanup'],
                examples: [
                    'startup/app.tsx',
                    'startup/server.ts',
                    'startup/queue-worker.ts',
                    'startup/scheduler-service.ts'
                ]
            }
        }
    }]
}
```

## Import Boundary Rules

```javascript
{
    // Direct source vs adapter enforcement
    'import-boundaries'
:
    ['error', {
        // These can be imported anywhere
        directSource: [
            'lodash',
            'lodash/*',
            'date-fns',
            'uuid',
            'classnames',
            'ramda',
            'node:*',
            'fs',
            'path',
            'crypto',
            'url',
            'querystring',
            'jest',
            '@jest/globals',
            '@testing-library/*',
            'vitest'
        ],

        // These must go through adapters/
        mustUseAdapter: {
            'axios': 'adapters/axios/**',
            'mongoose': 'adapters/mongoose/**',
            'express': 'adapters/express/**',
            'aws-sdk': 'adapters/aws/**',
            '@aws-sdk/*': 'adapters/aws/**',
            'bcrypt': 'adapters/bcrypt/**',
            'jsonwebtoken': 'adapters/jsonwebtoken/**',
            '@prisma/client': 'adapters/prisma/**',
            'bull': 'adapters/bull/**',
            'node-cron': 'adapters/cron/**',
            'nodemailer': 'adapters/email/**',
            'twilio': 'adapters/sms/**',
            'stripe': 'adapters/stripe/**'
        },

        // React/Frontend specific (can only be used in certain folders)
        frontendOnly: {
            'react': ['widgets/**', 'bindings/**', 'responders/**', 'startup/**'],
            'react-dom': ['startup/**'],
            'react-router-dom': ['flows/**', 'bindings/**'],
            '@mui/*': ['widgets/**'],
            'styled-components': ['widgets/**']
        },

        message: 'Import violates boundary rules. Use adapters/ for external packages.'
    }],

        // Prevent circular dependencies
        'no-circular-imports'
:
    ['error', {
        message: 'Circular imports detected',
        severity: 'error'
    }],

        // Import hierarchy enforcement
        'import-hierarchy'
:
    ['error', {
        levels: {
            // Bottom level - no dependencies
            'types': [],
            'errors': ['types'],

            // Pure functions
            'schemas': ['types', 'errors'],
            'transformers': ['types'],

            // External wrappers
            'adapters': [], // Only node_modules

            // Middle level
            'brokers': ['adapters', 'types', 'errors', 'schemas'],
            'state': ['types', 'errors'],

            // Orchestration level
            'bindings': ['brokers', 'state'],
            'triggers': ['brokers', 'schemas'],

            // UI level
            'widgets': ['bindings', 'triggers', 'state', 'types', 'transformers'],

            // Top level
            'responders': ['widgets', 'triggers', 'brokers', 'bindings', 'state', 'types', 'errors', 'schemas', 'transformers'],
            'flows': ['responders'],

            // Special - can import anything
            'startup': '*',

            // Static
            'assets': [],
            'migrations': ['types', 'schemas', 'transformers']
        },
        message: 'Import violates hierarchy. Lower levels cannot import from higher levels.'
    }]
}
```

## Testing Rules

```javascript
{
    // Test colocation enforcement
    'test-colocation'
:
    ['error', {
        pattern: '**/*.test.(ts|tsx)',
        mustBeColocated: true,
        examples: {
            valid: [
                'user-fetch/user-fetch.ts + user-fetch/user-fetch.test.ts',
                'UserCard/UserCard.tsx + UserCard/UserCard.test.tsx'
            ],
            invalid: [
                'user-fetch/user-fetch.ts + tests/user-fetch.test.ts'
            ]
        },
        message: 'Tests must be colocated with implementation'
    }],

        // Test file naming
        'test-naming'
:
    ['error', {
        pattern: '**/*.test.(ts|tsx)',
        mustMatch: '[implementation-name].test.(ts|tsx)'
    }]
}
```

## Naming Convention Rules

```javascript
{
    // File naming enforcement
    'file-naming'
:
    ['error', {
        rules: {
            'types/**/*.ts': /^[a-z-]+type\.ts$/,
            'schemas/**/*.ts': /^[a-z-]+schema\.ts$/,
            'transformers/**/*.ts': /^[a-z-]+\.ts$/,
            'errors/**/*.ts': /^[a-z-]+error\.ts$/,
            'flows/**/*.ts': /^[a-z-]+flow\.ts$/,
            'adapters/**/*.ts': /^[a-z-]+\.ts$/,
            'brokers/**/*.ts': /^[a-z-]+\.ts$/,
            'bindings/**/*.ts': /^use-[a-z-]+\.ts$/,
            'triggers/**/*.ts': /^[a-z-]+flow\.ts$/,
            'state/**/*.ts': /^[a-z-]+\.ts$/,
            'responders/**/*.tsx': /^[a-z-]+page\.tsx$/,
            'responders/**/*.ts': /^[a-z-]+controller\.ts$/,
            'widgets/**/*.tsx': /^[A-Z][a-zA-Z]*\.tsx$/,
            'migrations/**/*.ts': /^\\d{3}-[a-z-]+\.ts$/,
            'startup/**/*.ts': /^[a-z-]+\.ts$/
        }
    }],

        // Export naming patterns
        'export-naming'
:
    ['error', {
        rules: {
            'types/**/*.ts': 'PascalCase with Type suffix',
            'schemas/**/*.ts': 'camelCase with Schema suffix or validate/is prefix',
            'transformers/**/*.ts': 'camelCase with action verb prefix',
            'errors/**/*.ts': 'PascalCase with Error suffix',
            'adapters/**/*.ts': 'camelCase matching operation',
            'brokers/**/*.ts': 'camelCase with action verb',
            'bindings/**/*.ts': 'camelCase with use prefix',
            'triggers/**/*.ts': 'camelCase with Flow/Process suffix',
            'state/**/*.ts': 'camelCase get/set/clear prefixes',
            'responders/**/*.tsx': 'PascalCase with Page/Section suffix',
            'responders/**/*.ts': 'camelCase with Controller suffix',
            'widgets/**/*.tsx': 'PascalCase',
            'startup/**/*.ts': 'camelCase with start/init prefix'
        }
    }]
}
```

## Complete ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
    rules: {
        // Core organization
        'max-exports': ['error', {max: 1}],
        'no-index-files': 'error',
        'folder-name-pattern': 'error',
        'require-folder-structure': 'error',

        // Universal terms enforcement
        'allowed-folders': 'error',
        'universal-term-patterns': 'error',

        // Import boundaries
        'import-boundaries': 'error',
        'no-circular-imports': 'error',
        'import-hierarchy': 'error',

        // Testing
        'test-colocation': 'error',
        'test-naming': 'error',

        // Naming
        'file-naming': 'error',
        'export-naming': 'error'
    }
};
```

## Error Messages

When these rules are violated, developers will see clear error messages:

```
❌ ESLint Error: allowed-folders
Folder name 'utils' is forbidden. Use 'transformers' for pure functions.

❌ ESLint Error: allowed-folders
Folder name 'services' is forbidden. Use 'adapters' for external package wrappers.

❌ ESLint Error: universal-term-patterns
File in 'types/' cannot contain runtime code. Only type, interface, and enum allowed.

❌ ESLint Error: import-boundaries
Cannot import 'axios' directly. Use: import { get } from '../adapters/axios/get/get'

❌ ESLint Error: import-hierarchy
'widgets/' cannot import from 'brokers/'. Widgets can only use bindings and triggers.

❌ ESLint Error: folder-name-pattern
Main file must match folder name
Expected: user-fetch/user-fetch.ts
Found: user-fetch/index.ts
```

These rules enforce all the universal terminology patterns, preventing code from being organized incorrectly.