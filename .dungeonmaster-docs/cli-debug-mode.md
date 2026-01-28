# CLI Debug Mode - Manual Testing Guide

This document explains how to use the CLI debug mode for programmatic testing and debugging.

## Overview

The debug mode (`start-debug.ts`) is a JSON line protocol interface that allows programmatic control of the CLI
application. Unlike the interactive CLI, it reads JSON commands from stdin and outputs JSON responses to stdout, making
it ideal for:

- Automated testing of CLI screens
- Programmatic UI interaction verification
- Integration testing with external tools
- Debugging widget behavior without manual interaction

## How to Start Debug Mode

### Option 1: Direct Execution

```bash
npx tsx packages/cli/src/startup/start-debug.ts
```

### Option 2: Spawn as Child Process (Recommended for Testing)

```typescript
import { spawn } from 'child_process';
import { resolve } from 'path';

const childProcess = spawn('npx', ['tsx', resolve(__dirname, './start-debug.ts')], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd(),
});
```

## Communication Protocol

Debug mode uses **line-delimited JSON (JSONL)**:

- Send one JSON object per line (terminated with `\n`)
- Receive one JSON response per line
- Commands are processed sequentially

## Available Commands

### 1. START Command (Required First)

Initializes the debug session with a specific screen.

```json
{
  "action": "start",
  "screen": "menu"
}
```

**Parameters:**

- `screen` - One of: `menu`, `add`, `help`, `list`, `init`, `run`, `answer`

**Response:**

```json
{
  "success": true,
  "screen": {
    "name": "menu",
    "frame": "❱ Add\n  Run\n  List\n  Help\n  Exit",
    "elements": []
  },
  "callbacks": {
    "onSpawnChaoswhisperer": [],
    "onResumeChaoswhisperer": [],
    "onRunQuest": [],
    "onExit": []
  }
}
```

### 2. INPUT Command

Sends text input (like typing).

```json
{
  "action": "input",
  "text": "Build a new feature"
}
```

**Parameters:**

- `text` - Non-empty string to write to stdin

### 3. KEYPRESS Command

Sends keyboard key presses for navigation and interaction.

```json
{
  "action": "keypress",
  "key": "enter"
}
```

**Parameters:**

- `key` - One of: `enter`, `escape`, `up`, `down`, `backspace`, `tab`

**Key Code Mappings:**
| Key | Escape Code | Description |
|-----------|-------------|-------------|
| enter | `\r`        | Submit/confirm |
| escape | `\x1B`      | Cancel/go back |
| up | `\x1B[A`    | Move selection up |
| down | `\x1B[B`    | Move selection down |
| backspace | `\x7F`      | Delete character |
| tab | `\t`        | Tab/autocomplete |

### 4. GETSCREEN Command

Retrieves current screen state without sending input.

```json
{
  "action": "getScreen"
}
```

### 5. EXIT Command

Cleanly terminates the session.

```json
{
  "action": "exit"
}
```

## Response Format

All commands return a response with this structure:

```typescript
{
  success: boolean;           // Whether command executed successfully
  screen?: {
    name: string;             // Current screen name
    frame: string;            // Terminal output as string
    elements: ScreenElement[]; // Parsed UI elements
  };
  callbacks?: {               // Tracked callback invocations
    onSpawnChaoswhisperer: { userInput: string }[];
    onResumeChaoswhisperer: { answer: string; sessionId: string }[];
    onRunQuest: { questId: string; questFolder: string }[];
    onExit: Record<PropertyKey, never>[];
  };
  error?: string;             // Error message if success=false
}
```

## Workflow Examples

### Example 1: Navigate Menu and Select "Add"

```bash
# Start debug mode
npx tsx packages/cli/src/startup/start-debug.ts

# Send commands (one per line):
{"action": "start", "screen": "menu"}
# Response shows menu with "Add" selected

{"action": "keypress", "key": "enter"}
# Response shows add screen with input prompt
```

### Example 2: Submit Text on Add Screen

```bash
{"action": "start", "screen": "add"}
# Response shows input prompt "What would you like to build?"

{"action": "input", "text": "Build a REST API"}
# Response shows text in input field

{"action": "keypress", "key": "enter"}
# Response includes callback: onSpawnChaoswhisperer: [{userInput: "Build a REST API"}]
```

### Example 3: Navigate Back with Escape

```bash
{"action": "start", "screen": "add"}
{"action": "keypress", "key": "escape"}
# Response shows menu screen
```

## Error Handling

| Error Scenario            | Error Message                                         |
|---------------------------|-------------------------------------------------------|
| Invalid JSON              | `Invalid JSON command`                                |
| Invalid command structure | `Invalid JSON command`                                |
| Command before `start`    | `No active render session - send start command first` |
| Command after `exit`      | `Session already exited`                              |

## Testing Client Implementation

Here's a reusable TypeScript client for testing:

```typescript
import { spawn } from 'child_process';
import { resolve } from 'path';

type DebugResponse = {
  success: boolean;
  screen?: { name: string; frame: string; elements: unknown[] };
  callbacks?: Record<string, unknown[]>;
  error?: string;
};

const createDebugClient = () => {
  const childProcess = spawn('npx', ['tsx', 'packages/cli/src/startup/start-debug.ts'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  let responseBuffer = '';
  const pendingResolvers: ((value: DebugResponse) => void)[] = [];

  childProcess.stdout.on('data', (data: Buffer) => {
    responseBuffer += data.toString();
    const lines = responseBuffer.split('\n');
    while (lines.length > 1) {
      const line = lines.shift();
      if (line && line.length > 0) {
        const resolver = pendingResolvers.shift();
        if (resolver) {
          resolver(JSON.parse(line));
        }
      }
    }
    responseBuffer = lines[0] ?? '';
  });

  const sendCommand = async (command: unknown): Promise<DebugResponse> =>
    new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('Timeout')), 10000);
      pendingResolvers.push((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });
      childProcess.stdin.write(`${JSON.stringify(command)}\n`);
    });

  const close = () => childProcess.kill();

  return { sendCommand, close };
};

// Usage:
const client = createDebugClient();
const response = await client.sendCommand({ action: 'start', screen: 'menu' });
console.log(response.screen?.frame);
client.close();
```

## Render Timing

After sending `input` or `keypress` commands, the system waits **10ms** (`cliStatics.testing.useEffectDelayMs`) for
React effects to complete before capturing the frame. This ensures the UI has updated before returning the response.

## Available Screens

| Screen   | Purpose                                            |
|----------|----------------------------------------------------|
| `menu`   | Main menu with options: Add, Run, List, Help, Exit |
| `add`    | Text input for describing what to build            |
| `help`   | Help/documentation screen                          |
| `list`   | Lists existing quests                              |
| `init`   | Initialization screen                              |
| `run`    | Quest execution screen                             |
| `answer` | Answer/response screen                             |

## Callback Tracking

The debug mode tracks all widget callbacks invoked during the session:

- **onSpawnChaoswhisperer**: Triggered when user submits a quest description
- **onResumeChaoswhisperer**: Triggered when resuming an existing session
- **onRunQuest**: Triggered when user selects a quest to run
- **onExit**: Triggered when user exits

These are returned in every response, allowing tests to verify the correct callbacks were triggered with expected
parameters.

## Key Architecture Points

1. **Same Widget**: Debug mode uses the exact same `CliAppWidget` component as the normal CLI
2. **Ink Testing Library**: Uses `ink-testing-library` adapter for programmatic rendering
3. **Stateful Session**: State persists across commands within a session
4. **Line Protocol**: Each JSON command/response is a single line for easy parsing

## File Locations

| File                                                       | Purpose                           |
|------------------------------------------------------------|-----------------------------------|
| `packages/cli/src/startup/start-debug.ts`                  | Entry point                       |
| `packages/cli/src/startup/start-debug.integration.test.ts` | Integration tests (good examples) |
| `packages/cli/src/brokers/debug/session/`                  | Session management                |
| `packages/cli/src/brokers/debug/command-handler/`          | Command processing                |
| `packages/cli/src/contracts/debug-command/`                | Command contract                  |
| `packages/cli/src/contracts/debug-response/`               | Response contract                 |
| `packages/cli/src/statics/debug-keys/`                     | Key escape codes                  |
