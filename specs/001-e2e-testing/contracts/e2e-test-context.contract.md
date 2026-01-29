# Contract: E2ETestContext

**Purpose**: Defines the isolated test environment for E2E tests

## TypeScript Interface

```typescript
import { z } from 'zod';
import { ChildProcess } from 'child_process';

// Branded types
export type ProjectPath = string & { readonly __brand: 'ProjectPath' };
export type TimeoutMs = number & { readonly __brand: 'TimeoutMs' };

// Zod schema for serializable parts
export const e2eTestContextContract = z.object({
  projectPath: z.string().min(1),
  mcpConfigPath: z.string().min(1),
  questsPath: z.string().min(1),
  startTime: z.number().int().positive(),
  timeout: z.number().int().positive().default(60000),
});

// Runtime type (includes non-serializable ChildProcess)
export interface E2ETestContext {
  projectPath: ProjectPath;
  cliProcess: ChildProcess | null;
  mcpConfigPath: string;
  questsPath: string;
  startTime: number;
  timeout: TimeoutMs;
}

export type E2ETestContextInput = z.infer<typeof e2eTestContextContract>;
```

## Stub Factory

```typescript
export const E2ETestContextStub = (overrides?: Partial<E2ETestContext>): E2ETestContext => ({
  projectPath: '/tmp/e2e-test-abc123' as ProjectPath,
  cliProcess: null,
  mcpConfigPath: '/tmp/e2e-test-abc123/.mcp.json',
  questsPath: '/tmp/e2e-test-abc123/.dungeonmaster-quests',
  startTime: Date.now(),
  timeout: 60000 as TimeoutMs,
  ...overrides,
});
```

## Validation Rules

1. `projectPath` MUST be an absolute path
2. `projectPath` directory MUST exist when context is active
3. `timeout` MUST be a positive integer (milliseconds)
4. `cliProcess` MAY be null before CLI is spawned or after cleanup

## Usage

```typescript
// Create context
const context = await e2eHarnessBroker.createContext({
  baseName: 'quest-creation-test',
  timeout: 90000,
});

// Use context
await e2eHarnessBroker.startCli({ context });
await e2eHarnessBroker.sendInput({ context, text: 'Build a feature' });

// Cleanup
await e2eHarnessBroker.cleanup({ context });
```
