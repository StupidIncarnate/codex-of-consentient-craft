# Dungeonmaster Init Command & Package Install System

## Overview

Implement `dungeonmaster init` command that dynamically discovers packages and calls their install functions. Each
package handles its own installation logic. A testbed in `packages/testing` enables integration testing.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  dungeonmaster init                                              │
│  (packages/cli/src/startup/start-cli.ts)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Package Discovery Broker                                        │
│  (packages/cli/src/brokers/package/discover/)                   │
│  - Globs packages/*/src/startup/start-install.ts                │
│  - Returns list of packages with install files                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Install Orchestrate Broker                                      │
│  (packages/cli/src/brokers/install/orchestrate/)                │
│  - Loops through discovered packages                            │
│  - Calls each StartInstall function                             │
│  - Collects results, continues on failure                       │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ hooks            │ │ eslint-plugin    │ │ mcp              │
│ StartInstall     │ │ StartInstall     │ │ StartInstall     │
│ → settings.json  │ │ → eslint.config  │ │ → .mcp.json      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ config           │ │ shared           │ │ ...other pkgs    │
│ StartInstall     │ │ (no-op)          │ │ (no-op)          │
│ → .dungeonmaster │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## Phase 1: Shared Contracts

### Files to Create

| File                                                                        | Purpose                                         |
|-----------------------------------------------------------------------------|-------------------------------------------------|
| `packages/shared/src/contracts/install-context/install-context-contract.ts` | Context passed to install functions             |
| `packages/shared/src/contracts/install-result/install-result-contract.ts`   | Result returned by install functions            |
| `packages/shared/src/contracts/package-name/package-name-contract.ts`       | Branded package name type                       |
| `packages/shared/src/contracts/install-message/install-message-contract.ts` | Branded install message type                    |
| `packages/shared/src/guards/pre-install-check/pre-install-check-guard.ts`   | Validates project has package.json and .claude/ |

### InstallContext Contract

```typescript
// All properties use branded types from existing contracts
import {filePathContract, type FilePath} from '@dungeonmaster/shared/contracts';

export const installContextContract = z.object({
    targetProjectRoot: filePathContract,      // cwd - where to install
    dungeonmasterRoot: filePathContract,      // where dungeonmaster packages live
});
export type InstallContext = z.infer<typeof installContextContract>;
```

### InstallResult Contract

```typescript
// Uses branded types - no raw string/number
import {errorMessageContract, type ErrorMessage} from '@dungeonmaster/shared/contracts';

// Branded package name
export const packageNameContract = z.string().brand('PackageName');
export type PackageName = z.infer<typeof packageNameContract>;

// Branded message
export const installMessageContract = z.string().brand('InstallMessage');
export type InstallMessage = z.infer<typeof installMessageContract>;

export const installActionContract = z.enum(['created', 'merged', 'skipped', 'failed']);
export type InstallAction = z.infer<typeof installActionContract>;

export const installResultContract = z.object({
    packageName: packageNameContract,
    success: z.boolean(),
    action: installActionContract,
    message: installMessageContract.optional(),
    error: errorMessageContract.optional(),
});
export type InstallResult = z.infer<typeof installResultContract>;
```

---

## Phase 2: CLI Init Command

### Files to Modify

| File                                          | Change                     |
|-----------------------------------------------|----------------------------|
| `packages/cli/src/startup/start-cli.ts`       | Add `init` command handler |
| `packages/cli/src/statics/cli/cli-statics.ts` | Add `init` to commands     |

### Files to Create

| File                                                                         | Purpose                          |
|------------------------------------------------------------------------------|----------------------------------|
| `packages/cli/src/brokers/package/discover/package-discover-broker.ts`       | Find packages with install files |
| `packages/cli/src/brokers/install/orchestrate/install-orchestrate-broker.ts` | Run all installs                 |
| `packages/cli/src/brokers/install/execute/install-execute-broker.ts`         | Run single package install       |

### Package Discovery Logic

```typescript
// Pseudo-code
const packagesDir = path.join(dungeonmasterRoot, 'packages');
const packageDirs = fs.readdirSync(packagesDir);

for (const dir of packageDirs) {
    const installPath = path.join(packagesDir, dir, 'dist/startup/start-install.js');
    // OR src/startup/start-install.ts for dev
    if (fs.existsSync(installPath)) {
        packages.push({name: `@dungeonmaster/${dir}`, installPath});
    }
}
```

### CLI Usage

```bash
dungeonmaster init    # Init in current dir (must have package.json)
```

### Pre-Install Validation (runs before any package installs)

Must check these exist in cwd before proceeding:

1. `package.json` - must exist
2. `.claude/` directory - must exist

**Exit with error if missing:**

- No `package.json`: "No package.json found. Run init from a project root."
- No `.claude/`: "No .claude directory found. Initialize Claude Code first."

### PreInstallCheck Class (in `@dungeonmaster/shared`)

```typescript
// packages/shared/src/guards/pre-install-check/pre-install-check-guard.ts
export const preInstallCheckGuard = ({
                                         projectRoot,
                                     }: {
    projectRoot: FilePath;
}): { valid: boolean; error?: ErrorMessage } => {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const claudeDirPath = path.join(projectRoot, '.claude');

    if (!fs.existsSync(packageJsonPath)) {
        return {valid: false, error: 'No package.json found.'};
    }

    if (!fs.existsSync(claudeDirPath)) {
        return {valid: false, error: 'No .claude directory found.'};
    }

    return {valid: true};
};
```

The CLI runs this check ONCE before calling any package install functions.

---

## Phase 3: Package Install Functions

Each package gets `src/startup/start-install.ts` if it needs to install something.

### hooks Package

**File:** `packages/hooks/src/startup/start-install.ts`

**What it installs:**

- Adds hooks to `<project>/.claude/settings.json` (project-level, NOT ~/.claude)

**Logic:**

1. Check if `.claude/settings.json` exists in project
2. If exists → parse JSON, check if dungeonmaster hooks already present
    - If hooks already configured (check for "dungeonmaster" in command) → skip
    - Otherwise → merge hooks into existing settings
3. If not exists → create new `settings.json` in `.claude/`

**Target hooks config:**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "dungeonmaster-pre-edit-lint"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "dungeonmaster-session-start-hook"
          }
        ]
      }
    ]
  }
}
```

**Merge strategy (existing file):**

- Preserve all existing settings (tools, env, etc.)
- Append dungeonmaster hooks to existing hooks arrays
- Don't duplicate if already present

---

### eslint-plugin Package

**File:** `packages/eslint-plugin/src/startup/start-install.ts`

**What it installs:**

- Creates or edits `eslint.config.js` in target project

**Logic:**

1. Check for existing eslint config: `eslint.config.js`, `eslint.config.mjs`, `eslint.config.cjs`
2. If exists → parse and merge dungeonmaster plugin into existing config
3. If not exists → create new `eslint.config.js`

**Target config (new file):**

```javascript
const dungeonmaster = require('@dungeonmaster/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {parser: tsparser},
        plugins: {'@dungeonmaster': dungeonmaster},
        rules: {...dungeonmaster.configs.recommended.rules},
    },
];
```

**Merge strategy (existing file):**

- Detect if `@dungeonmaster` already in config → skip
- Otherwise, add dungeonmaster plugin to existing exports array

---

### mcp Package

**File:** `packages/mcp/src/startup/start-install.ts`

**What it installs:**

- Creates or edits `.mcp.json` in target project

**Logic:**

1. Check if `.mcp.json` exists
2. If exists → parse JSON, check if `mcpServers.dungeonmaster` exists
    - If dungeonmaster already configured → skip
    - Otherwise → add dungeonmaster to existing mcpServers object
3. If not exists → create new `.mcp.json`

**Target config (new file):**

```json
{
  "mcpServers": {
    "dungeonmaster": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "tsx",
        "node_modules/@dungeonmaster/mcp/src/index.ts"
      ]
    }
  }
}
```

**Merge strategy (existing file):**

```typescript
const existing = JSON.parse(fs.readFileSync('.mcp.json'));
if (!existing.mcpServers?.dungeonmaster) {
    existing.mcpServers = existing.mcpServers || {};
    existing.mcpServers.dungeonmaster = { /* config */};
    fs.writeFileSync('.mcp.json', JSON.stringify(existing, null, 2));
}
```

---

### config Package

**File:** `packages/config/src/startup/start-install.ts`

**What it installs:**

- Creates or edits `.dungeonmaster` in target project

**Logic:**

1. Check if `.dungeonmaster` exists
2. If exists → skip (don't overwrite user's config)
3. If not exists → create new `.dungeonmaster` with defaults

**Target config (new file):**

```json
{
  "framework": "node",
  "schema": "zod"
}
```

**Note:** Uses safe defaults. User edits file to customize framework.

---

### Packages with No-Op Install

These packages don't need to install anything but still get called:

- `shared` - Just exports, no install needed
- `testing` - Dev dependency only
- `tooling` - Dev dependency only
- `standards` - Documentation only
- `mock-rails` - Test fixtures only

They can either:

1. Not have a `start-install.ts` file (discovery skips them)
2. Have a no-op `StartInstall` that returns success immediately

---

## Phase 4: Testbed Infrastructure

### Files to Create in `packages/testing`

| File                                                                  | Purpose                 |
|-----------------------------------------------------------------------|-------------------------|
| `src/brokers/install-testbed/create/install-testbed-create-broker.ts` | Main testbed factory    |
| `src/contracts/install-testbed/install-testbed-contract.ts`           | Testbed type definition |

Note: No need for mock home dir - hooks write to project's `.claude/`, not `~/.claude`

### InstallTestbed Interface

Extends existing `TestProject` with:

```typescript
{
    // All TestProject methods plus:
    runInitCommand: () => ExecResult;
    getClaudeSettings: () => ClaudeSettings | null;  // reads .claude/settings.json
    getMcpConfig: () => McpConfig | null;            // reads .mcp.json
    getDungeonmasterConfig: () => DungeonmasterConfig | null;  // reads .dungeonmaster
    getEslintConfig: () => FileContent | null;       // reads eslint.config.js
}
```

### Testbed Setup

The testbed creates:

1. Test project in `/tmp`
2. `package.json` (required)
3. `.claude/` directory (required)

This satisfies pre-install validation so packages can be tested.

---

## Phase 5: Integration Tests

Each package with install logic gets integration tests:

### hooks Integration Test

**File:** `packages/hooks/src/startup/start-install.integration.test.ts`

```typescript
describe('hooks StartInstall', () => {
    it('creates settings.json with hooks when none exists', async () => {
        const testbed = installTestbedCreateBroker({
            baseName: baseNameContract.parse('hooks-test'),
        });

        await StartInstall({context: {targetProjectRoot: testbed.projectPath, ...}});

        const settings = testbed.getClaudeSettings();
        expect(settings?.hooks?.PreToolUse).toBeDefined();

        testbed.cleanup();
    });

    it('merges hooks into existing settings without overwriting', async () => {
        const testbed = installTestbedCreateBroker({
            baseName: baseNameContract.parse('hooks-merge'),
        });

        // Pre-populate .claude/settings.json
        testbed.writeFile({
            fileName: fileNameContract.parse('.claude/settings.json'),
            content: fileContentContract.parse(JSON.stringify({tools: {Write: {}}})),
        });

        await StartInstall({context: {targetProjectRoot: testbed.projectPath}});

        const settings = testbed.getClaudeSettings();
        expect(settings?.tools?.Write).toBeDefined();  // Preserved
        expect(settings?.hooks?.PreToolUse).toBeDefined();  // Added

        testbed.cleanup();
    });
});
```

---

## Implementation Order

```
1. Phase 1: Shared contracts & guards
   ├── install-context-contract.ts
   ├── install-result-contract.ts (with branded types)
   ├── pre-install-check-guard.ts
   └── Build shared package after

2. Phase 2: CLI init command
   ├── package-discover-broker
   ├── install-orchestrate-broker
   ├── Pre-install validation (calls preInstallCheckGuard)
   └── Update start-cli.ts

3. Phase 3: Package install functions (can be parallelized)
   ├── config/start-install.ts (simplest, do first)
   ├── mcp/start-install.ts
   ├── eslint-plugin/start-install.ts
   └── hooks/start-install.ts

4. Phase 4: Testbed infrastructure
   └── install-testbed-create-broker (extends integrationEnvironmentCreateBroker)
       - Creates package.json
       - Creates .claude/ directory

5. Phase 5: Integration tests for each package
```

---

## Critical Files Reference

| Purpose           | File                                                                                                   |
|-------------------|--------------------------------------------------------------------------------------------------------|
| CLI entry         | `packages/cli/src/startup/start-cli.ts`                                                                |
| Existing testbed  | `packages/testing/src/brokers/integration-environment/create/integration-environment-create-broker.ts` |
| Contract pattern  | `packages/shared/src/contracts/file-path/file-path-contract.ts`                                        |
| Startup pattern   | `packages/mcp/src/startup/start-mcp-server.ts`                                                         |
| Adapter pattern   | `packages/testing/src/adapters/fs/write-file/fs-write-file-adapter.ts`                                 |
| MCP config format | `.mcp.json` (project root)                                                                             |
| Claude settings   | `~/.claude/settings.json`                                                                              |
