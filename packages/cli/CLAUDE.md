# CLI Package - Claude Session Guide

## Debug Mode for Widget Testing

The CLI has a debug mode (`start-debug.ts`) that allows programmatic control of the `CliAppWidget` via JSON protocol.
Use this for testing widget behavior without interactive terminal sessions.

### When to Use Debug Mode

**Use for:**

- Testing widget navigation (menu -> add -> answer screens)
- Verifying text input is captured correctly
- Checking that callbacks fire with correct parameters
- Testing keypress handling (up/down/enter/escape)
- Validating screen rendering after interactions

**Cannot use for:**

- Testing `start-cli.ts` orchestration logic (the recursive loop that handles broker results)
- Testing what happens after `chaoswhispererSpawnStreamingBroker` returns
- Testing the flow: user submits -> broker runs -> signal returned -> correct screen shown
- Testing quest execution flow
- Any logic that lives outside `CliAppWidget`

### Architecture Boundary

```
┌─────────────────────────────────────────────────────────────────┐
│ start-cli.ts (Orchestration)                                    │
│   - Renders CliAppWidget                                        │
│   - Handles callbacks (onSpawnChaoswhisperer, onRunQuest, etc.) │
│   - Calls brokers based on callback results                     │  ← NOT TESTABLE via debug mode
│   - Decides next screen based on broker signals                 │
│   - Recursively calls itself with new screen                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ renders
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CliAppWidget (React/Ink Component)                              │
│   - Renders screens (menu, add, answer, list, etc.)             │
│   - Handles user input                                          │  ← TESTABLE via debug mode
│   - Fires callbacks when user completes actions                 │
│   - Manages internal navigation state                           │
└─────────────────────────────────────────────────────────────────┘
```

### Running Debug Mode

```bash
npx tsx packages/cli/src/startup/start-debug.ts
```

Send JSON commands to stdin, receive JSON responses from stdout.

### Commands

```typescript
// 1. START - Initialize session (required first)
{
    "action"
:
    "start", "screen"
:
    "menu"
}  // screens: menu, add, help, list, init, run, answer

// 2. INPUT - Send text
{
    "action"
:
    "input", "text"
:
    "Build a REST API"
}

// 3. KEYPRESS - Send key
{
    "action"
:
    "keypress", "key"
:
    "enter"
}  // keys: enter, escape, up, down, backspace, tab

// 4. GETSCREEN - Get current state without interaction
{
    "action"
:
    "getScreen"
}

// 5. EXIT - Clean shutdown
{
    "action"
:
    "exit"
}
```

### Response Format

```typescript
{
    success: boolean;
    screen ? : {
        name: string;      // Current screen
        frame: string;     // Terminal output as string
        elements: [];      // Parsed UI elements
    };
    callbacks ? : {        // Tracks which callbacks were invoked
        onSpawnChaoswhisperer: {userInput: string}[];
        onResumeChaoswhisperer: {answer: string; sessionId: string}[];
        onRunQuest: {questId: string; questFolder: string}[];
        onExit: {}[];
    };
    error ? : string;
}
```

### Example: Test Callback Firing

```typescript
const client = createDebugClient();

await client.sendCommand({action: 'start', screen: 'add'});
await client.sendCommand({action: 'input', text: 'Build a feature'});
const response = await client.sendCommand({action: 'keypress', key: 'enter'});

// Verify callback was invoked with correct params
expect(response.callbacks?.onSpawnChaoswhisperer).toEqual([
    {userInput: 'Build a feature'}
]);
```

### Debugging Orchestration Bugs

If the bug is in `start-cli.ts` (e.g., "signal handling returns unexpected results"), debug mode **cannot help**. That
logic is in the orchestration layer.

For orchestration bugs:

1. Add logging to `start-cli.ts` to inspect `result.signal` values
2. Test the broker directly to see what it returns

### Key Files

| File                                       | Purpose                               |
|--------------------------------------------|---------------------------------------|
| `startup/start-debug.ts`                   | Debug mode entry point                |
| `startup/start-debug.integration.test.ts`  | Working examples of debug client      |
| `startup/start-cli.ts`                     | Production CLI (orchestration layer)  |
| `widgets/cli-app/cli-app-widget.tsx`       | Main widget (testable via debug mode) |
| `statics/debug-keys/debug-keys-statics.ts` | Key escape code mappings              |

### Detailed Reference

See `/.dungeonmaster-docs/cli-debug-mode.md` for complete protocol documentation including the debug client
implementation pattern.
