# Task 03: Config Management

## Objective
Implement comprehensive configuration management for Questmaestro, including user preferences, project settings, and runtime state.

## Dependencies
- Task 02: Project Structure (for directory paths)

## Implementation

### 1. Enhanced Config Types

**File: src/cli/types/config.ts**
```typescript
export interface QuestmaestroConfig {
  // Core settings
  discoveryComplete: boolean;
  version: string;
  createdAt: string;
  lastUpdated: string;
  
  // User preferences
  preferences: {
    defaultEditor?: string;
    colorOutput: boolean;
    verboseLogging: boolean;
    maxActiveQuests: number;
    autoCleanDays: number; // Days before auto-cleaning completed quests
  };
  
  // Project settings
  project: {
    rootDirectory: string;
    packageManagers: string[]; // npm, yarn, pnpm detected
    testFrameworks: string[]; // jest, mocha, etc detected
    wardCommands: {
      all?: string;
      lint?: string;
      typecheck?: string;
      test?: string;
    };
  };
  
  // Runtime state
  runtime: {
    currentQuest?: string; // Active quest folder name
    sessionStart: string;
    lastDiscoveryRun?: string;
  };
}

export interface PackageJson {
  name: string;
  version: string;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
}
```

### 2. Config Manager Enhancement

**File: src/cli/config-manager.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { QuestmaestroConfig, PackageJson } from './types/config';
import { ensureDirectoryStructure } from './directory-manager';

const CONFIG_FILE = '.questmaestro';
const DEFAULT_CONFIG: QuestmaestroConfig = {
  discoveryComplete: false,
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  preferences: {
    colorOutput: true,
    verboseLogging: false,
    maxActiveQuests: 5,
    autoCleanDays: 30,
  },
  project: {
    rootDirectory: process.cwd(),
    packageManagers: [],
    testFrameworks: [],
    wardCommands: {},
  },
  runtime: {
    sessionStart: new Date().toISOString(),
  },
};

let cachedConfig: QuestmaestroConfig | null = null;

/**
 * Loads or creates the questmaestro configuration
 */
export async function loadConfig(): Promise<QuestmaestroConfig> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }
  
  // Ensure directory structure exists
  await ensureDirectoryStructure();
  
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configData) as QuestmaestroConfig;
    
    // Merge with defaults to handle new fields
    cachedConfig = mergeWithDefaults(config);
    
    // Update session start time
    cachedConfig.runtime.sessionStart = new Date().toISOString();
    await saveConfig(cachedConfig);
    
    return cachedConfig;
  } catch {
    // Create default config if doesn't exist
    cachedConfig = { ...DEFAULT_CONFIG };
    await saveConfig(cachedConfig);
    return cachedConfig;
  }
}

/**
 * Saves the questmaestro configuration
 */
export async function saveConfig(config: QuestmaestroConfig): Promise<void> {
  config.lastUpdated = new Date().toISOString();
  cachedConfig = config;
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Updates specific config fields
 */
export async function updateConfig(updates: DeepPartial<QuestmaestroConfig>): Promise<void> {
  const config = await loadConfig();
  const updatedConfig = deepMerge(config, updates);
  await saveConfig(updatedConfig);
}

/**
 * Sets the current active quest
 */
export async function setCurrentQuest(questFolder: string | undefined): Promise<void> {
  await updateConfig({
    runtime: {
      currentQuest: questFolder,
    },
  });
}

/**
 * Gets the current active quest
 */
export async function getCurrentQuest(): Promise<string | undefined> {
  const config = await loadConfig();
  return config.runtime.currentQuest;
}

/**
 * Detects project settings from package.json
 */
export async function detectProjectSettings(): Promise<Partial<QuestmaestroConfig['project']>> {
  const settings: Partial<QuestmaestroConfig['project']> = {
    packageManagers: [],
    testFrameworks: [],
    wardCommands: {},
  };
  
  // Find package.json files
  const packageJsonPaths = await findPackageJsons();
  
  for (const pkgPath of packageJsonPaths) {
    try {
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg: PackageJson = JSON.parse(content);
      
      // Detect package managers
      if (await fileExists('package-lock.json')) settings.packageManagers.push('npm');
      if (await fileExists('yarn.lock')) settings.packageManagers.push('yarn');
      if (await fileExists('pnpm-lock.yaml')) settings.packageManagers.push('pnpm');
      
      // Detect test frameworks
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps.jest) settings.testFrameworks.push('jest');
      if (allDeps.mocha) settings.testFrameworks.push('mocha');
      if (allDeps.vitest) settings.testFrameworks.push('vitest');
      if (allDeps.playwright) settings.testFrameworks.push('playwright');
      
      // Detect ward commands
      if (pkg.scripts) {
        if (pkg.scripts['ward:all']) settings.wardCommands.all = 'npm run ward:all';
        else if (pkg.scripts.ward) settings.wardCommands.all = 'npm run ward';
        
        if (pkg.scripts.lint) settings.wardCommands.lint = 'npm run lint';
        if (pkg.scripts.typecheck) settings.wardCommands.typecheck = 'npm run typecheck';
        if (pkg.scripts.test) settings.wardCommands.test = 'npm run test';
      }
    } catch (error) {
      console.warn(`Failed to parse ${pkgPath}:`, error);
    }
  }
  
  // Remove duplicates
  settings.packageManagers = [...new Set(settings.packageManagers)];
  settings.testFrameworks = [...new Set(settings.testFrameworks)];
  
  return settings;
}

/**
 * Finds all package.json files in the project
 */
export async function findPackageJsons(): Promise<string[]> {
  const results: string[] = [];
  
  async function search(dir: string, depth: number = 0): Promise<void> {
    if (depth > 5) return; // Limit search depth
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name === 'node_modules') continue;
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await search(fullPath, depth + 1);
        } else if (entry.name === 'package.json') {
          results.push(fullPath);
        }
      }
    } catch {
      // Ignore permission errors
    }
  }
  
  await search(process.cwd());
  return results;
}

// Helper functions

function mergeWithDefaults(config: Partial<QuestmaestroConfig>): QuestmaestroConfig {
  return deepMerge(DEFAULT_CONFIG, config) as QuestmaestroConfig;
}

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

### 3. Create User Preferences Handler

**File: src/cli/preferences.ts**
```typescript
import { updateConfig, loadConfig } from './config-manager';
import * as readline from 'readline/promises';

/**
 * Interactive preference configuration
 */
export async function configurePreferences(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  console.log('🔧 Configuring Questmaestro Preferences\n');
  
  try {
    const config = await loadConfig();
    
    // Color output
    const useColor = await rl.question(
      `Use colored output? (current: ${config.preferences.colorOutput}) [y/n]: `
    );
    if (useColor.toLowerCase() === 'y' || useColor.toLowerCase() === 'n') {
      config.preferences.colorOutput = useColor.toLowerCase() === 'y';
    }
    
    // Verbose logging
    const verbose = await rl.question(
      `Enable verbose logging? (current: ${config.preferences.verboseLogging}) [y/n]: `
    );
    if (verbose.toLowerCase() === 'y' || verbose.toLowerCase() === 'n') {
      config.preferences.verboseLogging = verbose.toLowerCase() === 'y';
    }
    
    // Max active quests
    const maxQuests = await rl.question(
      `Maximum active quests? (current: ${config.preferences.maxActiveQuests}): `
    );
    if (maxQuests && !isNaN(parseInt(maxQuests))) {
      config.preferences.maxActiveQuests = parseInt(maxQuests);
    }
    
    // Auto-clean days
    const cleanDays = await rl.question(
      `Days before auto-cleaning completed quests? (current: ${config.preferences.autoCleanDays}): `
    );
    if (cleanDays && !isNaN(parseInt(cleanDays))) {
      config.preferences.autoCleanDays = parseInt(cleanDays);
    }
    
    await updateConfig({ preferences: config.preferences });
    console.log('\n✅ Preferences saved!');
    
  } finally {
    rl.close();
  }
}

/**
 * Gets a user preference value
 */
export async function getPreference<K extends keyof QuestmaestroConfig['preferences']>(
  key: K
): Promise<QuestmaestroConfig['preferences'][K]> {
  const config = await loadConfig();
  return config.preferences[key];
}
```

### 4. Create Ward Command Detector

**File: src/cli/ward-detector.ts**
```typescript
import { PackageJson } from './types/config';
import { findPackageJsons } from './config-manager';
import * as fs from 'fs/promises';

export interface WardCommands {
  all?: string;
  lint?: string;
  typecheck?: string;
  test?: string;
}

/**
 * Detects ward commands from package.json
 */
export async function detectWardCommands(): Promise<WardCommands> {
  const commands: WardCommands = {};
  const packagePaths = await findPackageJsons();
  
  // Check root package.json first
  const rootPackage = packagePaths.find(p => p === 'package.json');
  if (rootPackage) {
    const detected = await detectFromPackageJson(rootPackage);
    Object.assign(commands, detected);
  }
  
  // If no ward:all found, check other packages
  if (!commands.all) {
    for (const pkgPath of packagePaths) {
      const detected = await detectFromPackageJson(pkgPath);
      if (detected.all) {
        Object.assign(commands, detected);
        break;
      }
    }
  }
  
  return commands;
}

async function detectFromPackageJson(pkgPath: string): Promise<WardCommands> {
  const commands: WardCommands = {};
  
  try {
    const content = await fs.readFile(pkgPath, 'utf-8');
    const pkg: PackageJson = JSON.parse(content);
    
    if (pkg.scripts) {
      // Check for ward:all or ward
      if (pkg.scripts['ward:all']) {
        commands.all = 'npm run ward:all';
      } else if (pkg.scripts.ward) {
        commands.all = 'npm run ward';
      }
      
      // Individual commands
      if (pkg.scripts.lint) commands.lint = 'npm run lint';
      if (pkg.scripts.typecheck) commands.typecheck = 'npm run typecheck';
      if (pkg.scripts.test) commands.test = 'npm run test';
      
      // If no ward:all but individual commands exist, create composite
      if (!commands.all && (commands.lint || commands.typecheck || commands.test)) {
        const parts = [];
        if (commands.lint) parts.push('npm run lint');
        if (commands.typecheck) parts.push('npm run typecheck');
        if (commands.test) parts.push('npm run test');
        commands.all = parts.join(' && ');
      }
    }
  } catch {
    // Ignore parse errors
  }
  
  return commands;
}

/**
 * Gets the ward:all command or constructs one
 */
export async function getWardAllCommand(): Promise<string | undefined> {
  const commands = await detectWardCommands();
  return commands.all;
}
```

## Unit Tests

**File: src/cli/config-manager.test.ts**
```typescript
import * as fs from 'fs/promises';
import {
  loadConfig,
  saveConfig,
  updateConfig,
  setCurrentQuest,
  detectProjectSettings,
  findPackageJsons,
} from './config-manager';

jest.mock('fs/promises');
jest.mock('./directory-manager');

describe('ConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cached config
    (global as any).cachedConfig = null;
  });

  describe('loadConfig', () => {
    it('should create default config on first run', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const config = await loadConfig();

      expect(config.discoveryComplete).toBe(false);
      expect(config.preferences.colorOutput).toBe(true);
      expect(config.project.rootDirectory).toBe(process.cwd());
    });

    it('should merge existing config with defaults', async () => {
      const partialConfig = {
        discoveryComplete: true,
        version: '1.0.0',
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(partialConfig));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const config = await loadConfig();

      expect(config.discoveryComplete).toBe(true);
      expect(config.preferences).toBeDefined();
      expect(config.preferences.colorOutput).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('should deep merge updates', async () => {
      const initialConfig = {
        discoveryComplete: false,
        preferences: {
          colorOutput: true,
          verboseLogging: false,
          maxActiveQuests: 5,
          autoCleanDays: 30,
        },
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(initialConfig));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await updateConfig({
        preferences: {
          verboseLogging: true,
        },
      });

      const savedCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const savedConfig = JSON.parse(savedCall[1]);

      expect(savedConfig.preferences.verboseLogging).toBe(true);
      expect(savedConfig.preferences.colorOutput).toBe(true); // Unchanged
    });
  });

  describe('detectProjectSettings', () => {
    it('should detect package managers', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'package.json', isDirectory: () => false },
        { name: 'package-lock.json', isDirectory: () => false },
      ]);
      
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        scripts: {},
        devDependencies: {},
      }));
      
      (fs.access as jest.Mock)
        .mockResolvedValueOnce(undefined) // package-lock.json exists
        .mockRejectedValue(new Error()); // others don't

      const settings = await detectProjectSettings();

      expect(settings.packageManagers).toContain('npm');
    });

    it('should detect test frameworks', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'package.json', isDirectory: () => false },
      ]);
      
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        devDependencies: {
          jest: '^29.0.0',
          '@types/jest': '^29.0.0',
        },
      }));

      const settings = await detectProjectSettings();

      expect(settings.testFrameworks).toContain('jest');
    });

    it('should detect ward commands', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'package.json', isDirectory: () => false },
      ]);
      
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        scripts: {
          'ward:all': 'npm run lint && npm run test',
          'lint': 'eslint .',
          'test': 'jest',
        },
      }));

      const settings = await detectProjectSettings();

      expect(settings.wardCommands.all).toBe('npm run ward:all');
      expect(settings.wardCommands.lint).toBe('npm run lint');
      expect(settings.wardCommands.test).toBe('npm run test');
    });
  });
});
```

**File: src/cli/ward-detector.test.ts**
```typescript
import * as fs from 'fs/promises';
import { detectWardCommands, getWardAllCommand } from './ward-detector';
import { findPackageJsons } from './config-manager';

jest.mock('fs/promises');
jest.mock('./config-manager');

describe('WardDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectWardCommands', () => {
    it('should detect ward:all command', async () => {
      (findPackageJsons as jest.Mock).mockResolvedValue(['package.json']);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        scripts: {
          'ward:all': 'npm run lint && npm run typecheck && npm run test',
        },
      }));

      const commands = await detectWardCommands();

      expect(commands.all).toBe('npm run ward:all');
    });

    it('should construct ward:all from individual commands', async () => {
      (findPackageJsons as jest.Mock).mockResolvedValue(['package.json']);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        scripts: {
          'lint': 'eslint .',
          'typecheck': 'tsc --noEmit',
          'test': 'jest',
        },
      }));

      const commands = await detectWardCommands();

      expect(commands.all).toBe('npm run lint && npm run typecheck && npm run test');
    });

    it('should handle missing scripts section', async () => {
      (findPackageJsons as jest.Mock).mockResolvedValue(['package.json']);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        name: 'test-project',
      }));

      const commands = await detectWardCommands();

      expect(commands.all).toBeUndefined();
    });
  });
});
```

## Validation Criteria

1. **Config Loading**
   - [ ] Creates default config on first run
   - [ ] Loads existing config correctly
   - [ ] Merges with defaults for new fields
   - [ ] Updates session start time

2. **Config Updates**
   - [ ] Deep merge works correctly
   - [ ] Partial updates preserve other fields
   - [ ] Current quest tracking works

3. **Project Detection**
   - [ ] Finds package.json files
   - [ ] Detects package managers
   - [ ] Detects test frameworks
   - [ ] Detects ward commands

4. **Ward Commands**
   - [ ] Detects ward:all command
   - [ ] Falls back to individual commands
   - [ ] Constructs composite command

5. **User Preferences**
   - [ ] Interactive configuration works
   - [ ] Preferences are saved correctly
   - [ ] Individual preference retrieval works

## Next Steps

After completing this task:
1. Run `npm test` to verify all tests pass
2. Test config creation and loading
3. Verify project settings detection
4. Test preference configuration
5. Proceed to [04-quest-model.md](04-quest-model.md)