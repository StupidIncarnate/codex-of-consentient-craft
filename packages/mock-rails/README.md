# Mock Rails

A comprehensive system for enforcing mock boundaries and teaching better testing practices.

## Overview

Mock Rails provides a configurable library of mock patterns with educational content to help teams write better tests.
Instead of the common "mock everything" approach that leads to false positives, it enforces boundaries and guides toward
appropriate mocking strategies.

## Key Principles

1. **Mock only at system boundaries** - child_process, fs, network calls
2. **Never mock application code** - Test through your real modules
3. **Use realistic mocks** - EventEmitters and streams, not simple objects
4. **Different rules for different test types** - Unit vs Integration vs E2E

## Pattern Categories

### System Boundaries ✅

Mock these external dependencies:

- `child_process` - Process spawning
- `fs` / `fs/promises` - File system operations
- `http` / `https` - Network requests
- `fetch` - Web API calls

### Application Code ❌

Never mock these:

- Relative imports (`./utils`, `../services`)
- Your business logic
- Internal utilities
- Configuration modules

### Third Party 🤔

Case-by-case basis:

- Database clients
- External APIs
- npm packages

## Usage

### Claude Code Hook Integration

The easiest way to use Mock Rails is through the pre-built Claude Code hook:

#### 1. Install the Package

```bash
npm install --save-dev @dungeonmaster/hooks
```

#### 2. Configure Claude Code Hooks

Create or update `.claude/hooks.json` in your project:

```json
{
  "PreToolUse": [
    {
      "command": "npx",
      "args": [
        "@dungeonmaster/hooks",
        "mockBoundaryHook"
      ]
    }
  ]
}
```

**Alternative (if installed locally):**

```json
{
  "PreToolUse": [
    {
      "command": "node",
      "args": [
        "node_modules/@dungeonmaster/hooks/dist/mock-boundary-hook.js"
      ]
    }
  ]
}
```

#### 3. How It Works

1. **User writes test code** in Claude Code
2. **Claude attempts Write/Edit** on `*.test.ts` files
3. **PreToolUse hook fires** before file is written
4. **Mock boundary validation runs** on the new content
5. **If violations found**: Write is blocked + educational message shown
6. **If clean**: Write proceeds normally

#### 4. What Gets Checked

The hook automatically validates:

- `*.test.ts` - Unit test files
- `*.integration.test.ts` - Integration test files
- `*.e2e.test.ts` - E2E test files
- `*.spec.ts` variants

Non-test files are ignored.

#### 5. Example Violation Message

```
❌ Mock Boundary Violation

Pattern: application-code.relative-import
Lines: 15
Test Type: unit
Risk Level: EXTREME

Why this matters:
Mocking your own application code defeats the purpose of testing - you want to verify the real integration between your modules

✅ Recommended Alternative: child_process.spawn.event-emitter
When appropriate: Unit tests that need to verify child process interaction logic without spawning real processes

Example Implementation:
import { EventEmitter } from "events"
import { PassThrough, Writable } from "stream"

const mockChild = new EventEmitter() as ChildProcess;
mockChild.stdout = new PassThrough();
mockChild.stderr = new PassThrough();
```

### Programmatic Hook Integration

For advanced use cases, you can create custom hooks:

```typescript
import {createMockBoundaryHook, DEFAULT_CONFIGS} from '@dungeonmaster/hooks/mock-rails';

const mockBoundaryHook = createMockBoundaryHook(DEFAULT_CONFIGS.strict);

// In your hook configuration
export const hooks = {
    preWrite: [mockBoundaryHook],
};
```

### Custom Configuration

For teams that want to customize the rules beyond the built-in presets:

#### Create Custom Hook File

```typescript
// .claude/custom-mock-hook.ts
import {validateMockBoundaries, type MockRailsConfig} from '@dungeonmaster/hooks';
import type {PreToolUseHookData} from '@dungeonmaster/hooks';

const customConfig: MockRailsConfig = {
    enabled: true,
    rules: {
        unit: [
            'child_process.spawn.event-emitter',
            'fs.promises.selective-mock',
            'fetch.global-mock',
        ],
        integration: [
            'child_process.spawn.controlled-executable',
            'fs.memfs',
            'network.nock',
        ],
        e2e: [
            'child_process.spawn.real-tool',
            'fs.temp-directory',
            'network.test-server',
        ],
    },
    customPatterns: [], // Add your own patterns
    education: {
        level: 'verbose',
        showAlternatives: true,
        showExamples: true,
    },
};

export async function customMockBoundaryHook(data: PreToolUseHookData): Promise<void> {
    // Only check test files  
    if (!data.tool_input.file_path?.match(/\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/)) {
        return;
    }

    const result = validateMockBoundaries({
        filePath: data.tool_input.file_path,
        content: data.tool_input.content,
        config: customConfig,
    });

    if (result.blocked) {
        console.error(result.message);
        process.exit(2);
    }
}
```

#### Update hooks.json

```json
{
  "PreToolUse": [
    {
      "command": "npx",
      "args": [
        "tsx",
        ".claude/custom-mock-hook.ts"
      ]
    }
  ]
}
```

### Configuration Presets

```typescript
import type {MockRailsConfig} from '@dungeonmaster/hooks/mock-rails';

const config: MockRailsConfig = {
    enabled: true,
    rules: {
        unit: [
            'child_process.spawn.event-emitter',
            'fs.promises.selective-mock',
            'fetch.global-mock',
        ],
        integration: [
            'child_process.spawn.controlled-executable',
            'fs.memfs',
            'network.nock',
        ],
        e2e: [
            'child_process.spawn.real-tool',
            'fs.temp-directory',
            'network.test-server',
        ],
    },
    customPatterns: [],
    education: {
        level: 'verbose',
        showAlternatives: true,
        showExamples: true,
    },
};
```

### Direct Validation

```typescript
import {validateMockBoundaries} from '@dungeonmaster/hooks/mock-rails';

const result = validateMockBoundaries({
    filePath: 'src/utils/helper.test.ts',
    content: testFileContent,
    config: myConfig,
});

if (result.blocked) {
    console.error(result.message);
    // Shows educational content about why the mock is problematic
}
```

## Available Patterns

### Child Process Patterns

| Pattern                                     | Risk    | Test Types  | Description                              |
|---------------------------------------------|---------|-------------|------------------------------------------|
| `child_process.full-mock`                   | extreme | none        | Complete module mock - never appropriate |
| `child_process.spawn.event-emitter`         | low     | unit        | Realistic EventEmitter mock              |
| `child_process.spawn.controlled-executable` | none    | integration | Real spawn with test script              |
| `child_process.spawn.real-tool`             | none    | e2e         | Actual external tool                     |

### File System Patterns

| Pattern                      | Risk    | Test Types       | Description                          |
|------------------------------|---------|------------------|--------------------------------------|
| `fs.full-mock`               | extreme | none             | Complete fs mock - never appropriate |
| `fs.promises.selective-mock` | low     | unit             | Mock specific methods only           |
| `fs.memfs`                   | none    | integration      | In-memory filesystem                 |
| `fs.temp-directory`          | none    | integration, e2e | Real filesystem with cleanup         |

### Network Patterns

| Pattern               | Risk    | Test Types       | Description                            |
|-----------------------|---------|------------------|----------------------------------------|
| `http.full-mock`      | extreme | none             | Complete http mock - never appropriate |
| `fetch.global-mock`   | low     | unit             | Mock global fetch function             |
| `network.nock`        | low     | integration      | HTTP call interception                 |
| `network.test-server` | none    | integration, e2e | Real HTTP server                       |

## Configuration Presets

### Strict

- Only allows low-risk patterns
- Emphasizes integration testing
- Verbose educational messages

```typescript
import {DEFAULT_CONFIGS} from '@dungeonmaster/hooks/mock-rails';

const config = DEFAULT_CONFIGS.strict;
```

### Balanced

- Allows reasonable mocking for unit tests
- Good default for most teams
- Normal educational level

```typescript
const config = DEFAULT_CONFIGS.balanced;
```

### Permissive

- Allows more patterns but blocks the worst ones
- For teams transitioning from heavy mocking
- Reduced educational verbosity

```typescript
const config = DEFAULT_CONFIGS.permissive;
```

## Educational Messages

When a violation is detected, Mock Rails provides:

1. **Why it matters** - Explanation of the problem
2. **False positive risk** - What could go wrong
3. **Better alternative** - Specific pattern to use instead
4. **Code examples** - Implementation guidance
5. **Philosophy** - Testing principles

Example violation message:

```
❌ Mock Boundary Violation

Pattern: application-code.relative-import
Lines: 15
Test Type: unit
Risk Level: EXTREME

Why this matters:
Mocking your own application code defeats the purpose of testing - you want to verify the real integration between your modules

False Positive Risk:
Extreme - test passes even when actual module logic is broken or integration fails

✅ Recommended Alternative: child_process.spawn.event-emitter
When appropriate: Unit tests that need to verify child process interaction logic without spawning real processes

Example Implementation:
import { EventEmitter } from "events"
import { PassThrough, Writable } from "stream"

const mockChild = new EventEmitter() as ChildProcess;
mockChild.stdout = new PassThrough();
mockChild.stderr = new PassThrough();
```

## Extending with Custom Patterns

```typescript
import type {MockPattern} from '@dungeonmaster/hooks/mock-rails';

const customPattern: MockPattern = {
    id: 'my-custom.database-mock',
    module: 'pg',
    pattern: /jest\.mock\(['"]pg['"]\)/,
    category: 'third-party',
    testTypes: ['unit'],
    risk: 'medium',
    implementation: {
        code: 'const mockPool = { query: jest.fn() };',
        imports: [],
    },
    education: {
        why: 'Mocks database connection for unit testing',
        falsePositiveRisk: 'Medium - SQL queries not validated',
        whenAppropriate: 'Unit tests that need isolated database logic',
        alternative: 'database.test-container',
    },
};

const config: MockRailsConfig = {
    // ...other config
    customPatterns: [customPattern],
};
```

## Analysis and Reporting

```typescript
import {analyzeTestFile, generateEducationalReport} from '@dungeonmaster/hooks/mock-rails';

// Get detailed analysis
const analysis = analyzeTestFile({filePath, content, config});
console.log(`Overall Score: ${analysis.score.overall}/100`);

// Generate educational report  
const report = generateEducationalReport({filePath, content, config});
console.log(report);
```

## CLI Usage (Future)

```bash
# List available patterns
npx @dungeonmaster/hooks mock-rails list --module child_process

# Explain a specific pattern
npx @dungeonmaster/hooks mock-rails explain child_process.spawn.event-emitter

# Generate configuration
npx @dungeonmaster/hooks mock-rails init --preset strict

# Analyze test files
npx @dungeonmaster/hooks mock-rails analyze src/**/*.test.ts
```

## Philosophy

Mock Rails is built on the principle that tests should catch real bugs, not just achieve coverage. By enforcing
boundaries and providing education, it helps teams:

1. **Write fewer, better mocks** that don't hide integration issues
2. **Test behavior, not implementation** through public interfaces
3. **Use the right testing strategy** for each level (unit/integration/e2e)
4. **Learn testing best practices** through immediate feedback

The goal is to make "test-driven development" actually drive better design and catch real problems.