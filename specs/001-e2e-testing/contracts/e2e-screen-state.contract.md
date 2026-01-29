# Contract: E2EScreenState

**Purpose**: Represents a captured snapshot of CLI terminal output

## TypeScript Interface

```typescript
import { z } from 'zod';

// Screen name enum
export const cliScreenName = z.enum([
  'menu',
  'add',
  'list',
  'help',
  'run',
  'answer',
  'init',
]);

export type CliScreenName = z.infer<typeof cliScreenName>;

// Zod schema
export const e2eScreenStateContract = z.object({
  name: cliScreenName,
  frame: z.string(),
  capturedAt: z.number().int().positive(),
});

export type E2EScreenState = z.infer<typeof e2eScreenStateContract>;
```

## Stub Factory

```typescript
export const E2EScreenStateStub = (overrides?: Partial<E2EScreenState>): E2EScreenState => ({
  name: 'menu',
  frame: '┌──────────────────────────────┐\n│  DungeonMaster               │\n│  > Add                       │\n│    Run                       │\n│    List                      │\n└──────────────────────────────┘',
  capturedAt: Date.now(),
  ...overrides,
});
```

## Screen Detection Patterns

Each screen has characteristic content that can be used for detection:

| Screen | Detection Pattern | Example Content |
|--------|------------------|-----------------|
| menu | `/Add.*Run.*List/s` | Menu options |
| add | `/What would you like to build/` | Input prompt |
| list | Quest names or "No quests" | Quest list |
| answer | Question text with `?` | MCP question |
| help | `/Help\|Commands/` | Help text |
| run | `/Select.*quest\|Run/` | Quest selection |
| init | `/Initialize\|Setup/` | Init wizard |

## Usage

```typescript
// Capture current screen
const screen = await e2eHarnessBroker.getScreen({ context });

// Assert screen type
expect(screen.name).toBe('list');

// Assert screen content
expect(screen.frame).toContain('DangerFun');
expect(screen.frame).not.toContain('Testing cli workflow');
```

## Frame Content Notes

- `frame` contains raw terminal output including ANSI escape codes
- Strip ANSI codes for content assertions: `stripAnsi(frame)`
- Frame may include box-drawing characters (Unicode)
- Frame width depends on terminal width (default: 80 columns)
