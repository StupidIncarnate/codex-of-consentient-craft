# Task 01: CLI Setup

## Objective
Create the command-line interface entry point for Questmaestro with basic command parsing and execution framework.

## Dependencies
- None (first task)

## Implementation

### 1. Create CLI Entry Point

**File: src/cli/index.ts**
```typescript
#!/usr/bin/env node

import { program } from 'commander';
import { handleCommand } from './commands';
import { checkProjectDiscovery } from './discovery';
import { loadConfig } from './config';
import { version } from '../../package.json';

async function main() {
  // Load config
  const config = await loadConfig();
  
  // Check if project discovery is needed
  if (!config.discoveryComplete) {
    await checkProjectDiscovery();
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🗺️  QUESTMAESTRO - AI Agent Orchestrator');
    console.log('Usage: questmaestro <command or quest name>');
    console.log('\nCommands:');
    console.log('  list              Show all active quests');
    console.log('  abandon           Abandon current quest');
    console.log('  reorder           Reorder quest priority');
    console.log('  start <quest>     Start a specific quest');
    console.log('  clean             Clean old completed/abandoned quests');
    console.log('  <quest name>      Create new quest or resume existing');
    process.exit(0);
  }
  
  // Handle command
  await handleCommand(args);
}

// Run main with error handling
main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
```

### 2. Create Command Handler

**File: src/cli/commands.ts**
```typescript
import { showQuestList } from './commands/list';
import { abandonCurrentQuest } from './commands/abandon';
import { reorderQuests } from './commands/reorder';
import { startSpecificQuest } from './commands/start';
import { cleanOldQuests } from './commands/clean';
import { handleQuestOrCreate } from './quest-handler';

// Command detection without AI
const COMMANDS: Record<string, (args: string[]) => Promise<void>> = {
  'list': showQuestList,
  'abandon': abandonCurrentQuest,
  'reorder': reorderQuests,
  'start': startSpecificQuest,
  'clean': cleanOldQuests,
};

export async function handleCommand(args: string[]): Promise<void> {
  const command = args[0].toLowerCase();
  
  // Check if it's a known command
  if (COMMANDS[command]) {
    await COMMANDS[command](args.slice(1));
  } else {
    // Treat as quest name
    const questName = args.join(' ');
    await handleQuestOrCreate(questName);
  }
}
```

### 3. Create Quest Handler Stub

**File: src/cli/quest-handler.ts**
```typescript
import { findQuest } from './quest-finder';
import { createQuest } from './quest-manager';
import { runQuest } from './quest-runner';

export async function handleQuestOrCreate(input: string): Promise<void> {
  console.log(`🔍 Searching for quest: "${input}"`);
  
  // Try to find existing quest
  const existingQuest = await findQuest(input);
  
  if (existingQuest) {
    console.log(`📜 Resuming quest: ${existingQuest.title}`);
    await runQuest(existingQuest);
  } else {
    console.log(`✨ Creating new quest: ${input}`);
    const quest = await createQuest(input);
    await runQuest(quest);
  }
}
```

### 4. Create Command Stubs

**File: src/cli/commands/list.ts**
```typescript
export async function showQuestList(args: string[]): Promise<void> {
  console.log('📋 Active Quests:');
  // TODO: Implement in task 05
  console.log('(Quest list implementation pending)');
}
```

**File: src/cli/commands/abandon.ts**
```typescript
export async function abandonCurrentQuest(args: string[]): Promise<void> {
  console.log('🚮 Abandoning quest...');
  // TODO: Implement in task 05
  console.log('(Abandon implementation pending)');
}
```

**File: src/cli/commands/reorder.ts**
```typescript
export async function reorderQuests(args: string[]): Promise<void> {
  console.log('🔢 Reordering quests...');
  // TODO: Implement in task 05
  console.log('(Reorder implementation pending)');
}
```

**File: src/cli/commands/start.ts**
```typescript
export async function startSpecificQuest(args: string[]): Promise<void> {
  const questName = args.join(' ');
  console.log(`🚀 Starting quest: ${questName}`);
  // TODO: Implement in task 05
  console.log('(Start implementation pending)');
}
```

**File: src/cli/commands/clean.ts**
```typescript
export async function cleanOldQuests(args: string[]): Promise<void> {
  console.log('🧹 Cleaning old quests...');
  // TODO: Implement in task 20
  console.log('(Clean implementation pending)');
}
```

### 5. Create Package.json Updates

**Update: package.json**
```json
{
  "name": "questmaestro",
  "version": "1.0.0",
  "description": "AI Agent Orchestrator CLI",
  "main": "dist/cli/index.js",
  "bin": {
    "questmaestro": "./dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/cli/index.ts",
    "test": "jest",
    "ward:all": "npm run lint && npm run typecheck && npm run test",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "chalk": "^4.1.2"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "ts-node": "^10.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 6. Create TypeScript Config

**File: tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 7. Create ESLint Config

**File: .eslintrc.js**
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

## Unit Tests

**File: src/cli/commands.test.ts**
```typescript
import { handleCommand } from './commands';
import { showQuestList } from './commands/list';
import { handleQuestOrCreate } from './quest-handler';

jest.mock('./commands/list');
jest.mock('./quest-handler');

describe('handleCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle list command', async () => {
    await handleCommand(['list']);
    expect(showQuestList).toHaveBeenCalledWith([]);
  });

  it('should handle quest name', async () => {
    await handleCommand(['add', 'authentication']);
    expect(handleQuestOrCreate).toHaveBeenCalledWith('add authentication');
  });

  it('should handle single word quest', async () => {
    await handleCommand(['refactor']);
    expect(handleQuestOrCreate).toHaveBeenCalledWith('refactor');
  });
});
```

## Validation Criteria

1. **CLI Entry Point**
   - [ ] Script runs with `node dist/cli/index.js`
   - [ ] Shows help when no arguments provided
   - [ ] Correctly parses command line arguments

2. **Command Detection**
   - [ ] Recognizes all built-in commands
   - [ ] Treats non-commands as quest names
   - [ ] Handles multi-word quest names

3. **Build System**
   - [ ] TypeScript compiles without errors
   - [ ] ESLint passes
   - [ ] Jest tests pass

4. **Error Handling**
   - [ ] Catches and displays errors gracefully
   - [ ] Exits with proper error codes

## Next Steps

After completing this task:
1. Run `npm install` to install dependencies
2. Run `npm run build` to compile TypeScript
3. Run `npm test` to verify tests pass
4. Test CLI with `node dist/cli/index.js`
5. Proceed to [02-project-structure.md](02-project-structure.md)