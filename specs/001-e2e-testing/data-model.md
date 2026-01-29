# Data Model: E2E Testing Harness

**Feature**: 001-e2e-testing
**Date**: 2026-01-28

## Entities

### CliScreenName (Branded Enum)

Represents valid CLI screen identifiers.

**Contract** (`cli-screen-name-contract.ts`):
```typescript
import { z } from 'zod';

export const cliScreenNameContract = z.enum([
  'menu',
  'add',
  'list',
  'help',
  'run',
  'answer',
  'init',
]).brand<'CliScreenName'>();

export type CliScreenName = z.infer<typeof cliScreenNameContract>;
```

**Stub** (`cli-screen-name.stub.ts`):
```typescript
import { cliScreenNameContract } from './cli-screen-name-contract';
import type { CliScreenName } from './cli-screen-name-contract';

export const CliScreenNameStub = (
  { value }: { value: string } = { value: 'menu' }
): CliScreenName => cliScreenNameContract.parse(value);
```

---

### ScreenFrame (Branded String)

Represents raw terminal output captured from CLI.

**Contract** (`screen-frame-contract.ts`):
```typescript
import { z } from 'zod';

export const screenFrameContract = z.string().brand<'ScreenFrame'>();

export type ScreenFrame = z.infer<typeof screenFrameContract>;
```

**Stub** (`screen-frame.stub.ts`):
```typescript
import { screenFrameContract } from './screen-frame-contract';
import type { ScreenFrame } from './screen-frame-contract';

export const ScreenFrameStub = (
  { value }: { value: string } = { value: '┌──────────┐\n│  Menu    │\n└──────────┘' }
): ScreenFrame => screenFrameContract.parse(value);
```

---

### E2EScreenState

Represents a captured snapshot of CLI screen output.

**Contract** (`e2e-screen-state-contract.ts`):
```typescript
import { z } from 'zod';
import { cliScreenNameContract } from '../cli-screen-name/cli-screen-name-contract';
import { screenFrameContract } from '../screen-frame/screen-frame-contract';

export const e2eScreenStateContract = z.object({
  name: cliScreenNameContract,
  frame: screenFrameContract,
  capturedAt: z.number().int().positive().brand<'Timestamp'>(),
});

export type E2EScreenState = z.infer<typeof e2eScreenStateContract>;
```

**Stub** (`e2e-screen-state.stub.ts`):
```typescript
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { e2eScreenStateContract } from './e2e-screen-state-contract';
import type { E2EScreenState } from './e2e-screen-state-contract';

export const E2EScreenStateStub = (
  { ...props }: StubArgument<E2EScreenState> = {}
): E2EScreenState => e2eScreenStateContract.parse({
  name: 'menu',
  frame: '┌──────────┐\n│  Menu    │\n└──────────┘',
  capturedAt: 1704067200000,
  ...props,
});
```

---

### E2ETestbed

Represents the E2E test environment, extending InstallTestbed.

**Contract** (`e2e-testbed-contract.ts`):
```typescript
import { z } from 'zod';
import { installTestbedContract } from '../install-testbed/install-testbed-contract';
import { cliScreenNameContract } from '../cli-screen-name/cli-screen-name-contract';
import { screenFrameContract } from '../screen-frame/screen-frame-contract';

// E2E testbed extends install testbed with CLI control methods
export const e2eTestbedContract = installTestbedContract.extend({
  // CLI subprocess reference (non-serializable, excluded from parse)
});

// Full runtime type includes functions
export interface E2ETestbed extends z.infer<typeof e2eTestbedContract> {
  // Inherited from InstallTestbed
  projectPath: string & z.BRAND<'ProjectPath'>;
  dungeonmasterPath: string & z.BRAND<'DungeonmasterPath'>;
  cleanup: () => void;
  writeFile: (args: { relativePath: string; content: string }) => void;
  readFile: (args: { relativePath: string }) => string | null;
  getClaudeSettings: () => unknown;
  getMcpConfig: () => unknown;
  getDungeonmasterConfig: () => unknown;
  getEslintConfig: () => string | null;
  runInitCommand: () => { exitCode: number; stdout: string; stderr: string };

  // E2E-specific methods
  startCli: () => Promise<void>;
  stopCli: () => void;
  sendInput: (args: { text: string }) => Promise<void>;
  sendKeypress: (args: { key: KeyName }) => Promise<void>;
  getScreen: () => Promise<E2EScreenState>;
  waitForScreen: (args: {
    screen: CliScreenName;
    contains?: string;
    excludes?: string;
    timeout?: number;
  }) => Promise<E2EScreenState>;
  getQuestFiles: () => string[];
  readQuestFile: (args: { folder: string }) => QuestFile;
}

type KeyName = 'enter' | 'escape' | 'up' | 'down' | 'backspace' | 'tab';
type CliScreenName = z.infer<typeof cliScreenNameContract>;
type E2EScreenState = { name: CliScreenName; frame: string; capturedAt: number };
type QuestFile = Record<string, unknown>;  // Quest structure from existing contracts
```

**Note**: Stub not needed for testbed - it's a service object created by broker, not test data.

---

### E2ETimeouts (Statics)

Immutable timeout configuration values.

**Statics** (`e2e-timeouts-statics.ts`):
```typescript
export const e2eTimeoutsStatics = {
  /** Default wait for screen transitions (30 seconds) */
  defaultWait: 30000,

  /** Timeout for Claude operations (90 seconds) */
  claudeOperation: 90000,

  /** Interval between screen polls (100ms) */
  pollInterval: 100,

  /** CLI process startup time (5 seconds) */
  processStartup: 5000,
} as const;
```

---

## Relationships

```
E2ETestbed
    │
    ├── extends ── InstallTestbed (composition)
    │                 ├── projectPath
    │                 ├── writeFile()
    │                 ├── readFile()
    │                 ├── runInitCommand()
    │                 └── cleanup()
    │
    ├── 1:1 ── CLI subprocess (ChildProcess)
    │
    ├── 1:N ── E2EScreenState (captured over time)
    │              ├── name: CliScreenName
    │              ├── frame: ScreenFrame
    │              └── capturedAt: Timestamp
    │
    └── 1:N ── QuestFile (created during test)
```

## Data Flow

```
Test Start
    │
    ▼
e2eTestbedCreateBroker({ baseName })
    │
    ├── installTestbedCreateBroker() (creates temp dir)
    │
    ├── testbed.runInitCommand() (runs dungeonmaster init)
    │       └── Sets up: .mcp.json, .claude/settings.json, hooks
    │
    └── Returns E2ETestbed
    │
    ▼
testbed.startCli()
    │
    └── spawn('npx', ['tsx', 'start-cli.ts'], { cwd: projectPath })
    │
    ▼
testbed.sendInput({ text }) / testbed.sendKeypress({ key })
    │
    └── process.stdin.write(text + '\r') / process.stdin.write(escapeCode)
    │
    ▼
testbed.waitForScreen({ screen, contains })
    │
    ├── Poll stdout every 100ms
    ├── Check screen pattern matches
    └── Return E2EScreenState or throw timeout
    │
    ▼
testbed.getQuestFiles() / testbed.readQuestFile({ folder })
    │
    └── List/read from .dungeonmaster-quests/
    │
    ▼
testbed.stopCli() / testbed.cleanup()
    │
    ├── Kill CLI subprocess
    └── Remove temp directory
```

## File Structure After Init

```
/tmp/dm-e2e-test-abc123/
├── package.json                   # Created by installTestbedCreateBroker
├── .claude/
│   └── settings.json              # Created by dungeonmaster init (hooks)
├── .mcp.json                      # Created by dungeonmaster init (MCP server)
├── .dungeonmaster                 # Created by dungeonmaster init (CLI config)
├── eslint.config.js               # Created by dungeonmaster init
└── .dungeonmaster-quests/         # Created when quest added
    └── 001-danger-fun/
        └── quest.json
```
