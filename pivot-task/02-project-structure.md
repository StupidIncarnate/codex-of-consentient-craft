# Task 02: Project Structure

## Objective
Set up the questmaestro directory structure and implement functions to create and manage the directory hierarchy.

## Dependencies
- Task 01: CLI Setup (for integration)

## Implementation

### 1. Create Directory Manager

**File: src/cli/directory-manager.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

export const QUESTMAESTRO_DIR = 'questmaestro';

export const DIRECTORIES = {
  discovery: path.join(QUESTMAESTRO_DIR, 'discovery'),
  active: path.join(QUESTMAESTRO_DIR, 'active'),
  completed: path.join(QUESTMAESTRO_DIR, 'completed'),
  abandoned: path.join(QUESTMAESTRO_DIR, 'abandoned'),
  retros: path.join(QUESTMAESTRO_DIR, 'retros'),
  lore: path.join(QUESTMAESTRO_DIR, 'lore'),
};

/**
 * Ensures all questmaestro directories exist
 */
export async function ensureDirectoryStructure(): Promise<void> {
  // Create main directory
  await fs.mkdir(QUESTMAESTRO_DIR, { recursive: true });
  
  // Create subdirectories
  for (const dir of Object.values(DIRECTORIES)) {
    await fs.mkdir(dir, { recursive: true });
  }
  
  // Create .gitignore in questmaestro directory
  const gitignorePath = path.join(QUESTMAESTRO_DIR, '.gitignore');
  const gitignoreContent = `# Questmaestro working files
active/
completed/
abandoned/
discovery/

# Keep structure files
!.gitkeep
`;
  
  try {
    await fs.access(gitignorePath);
  } catch {
    await fs.writeFile(gitignorePath, gitignoreContent);
  }
  
  // Create .gitkeep files to preserve empty directories
  for (const dir of Object.values(DIRECTORIES)) {
    const gitkeepPath = path.join(dir, '.gitkeep');
    try {
      await fs.access(gitkeepPath);
    } catch {
      await fs.writeFile(gitkeepPath, '');
    }
  }
}

/**
 * Creates a quest directory in the active folder
 */
export async function createQuestDirectory(questId: string, questTitle: string): Promise<string> {
  const folderName = `${questId}-${questTitle.toLowerCase().replace(/\s+/g, '-')}`;
  const questPath = path.join(DIRECTORIES.active, folderName);
  
  await fs.mkdir(questPath, { recursive: true });
  
  return folderName;
}

/**
 * Moves a quest directory from active to completed
 */
export async function moveQuestToCompleted(questFolder: string): Promise<void> {
  const sourcePath = path.join(DIRECTORIES.active, questFolder);
  const destPath = path.join(DIRECTORIES.completed, questFolder);
  
  await fs.rename(sourcePath, destPath);
}

/**
 * Moves a quest directory from active to abandoned
 */
export async function moveQuestToAbandoned(questFolder: string): Promise<void> {
  const sourcePath = path.join(DIRECTORIES.active, questFolder);
  const destPath = path.join(DIRECTORIES.abandoned, questFolder);
  
  await fs.rename(sourcePath, destPath);
}

/**
 * Lists all directories in a given path
 */
export async function listDirectories(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch {
    return [];
  }
}

/**
 * Gets all active quest folders
 */
export async function getActiveQuestFolders(): Promise<string[]> {
  return listDirectories(DIRECTORIES.active);
}

/**
 * Checks if a quest folder exists in active directory
 */
export async function questFolderExists(questFolder: string): Promise<boolean> {
  const questPath = path.join(DIRECTORIES.active, questFolder);
  try {
    await fs.access(questPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a timestamped filename for discovery reports
 */
export function createDiscoveryFilename(packageName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `voidpoker-${timestamp}-${packageName}-report.json`;
}

/**
 * Gets the full path for a quest folder
 */
export function getQuestPath(questFolder: string): string {
  return path.join(DIRECTORIES.active, questFolder);
}

/**
 * Gets all report files in a quest folder
 */
export async function getQuestReports(questFolder: string): Promise<string[]> {
  const questPath = getQuestPath(questFolder);
  try {
    const files = await fs.readdir(questPath);
    return files
      .filter(f => f.endsWith('-report.json'))
      .sort(); // Ensures numerical order
  } catch {
    return [];
  }
}
```

### 2. Update Config Manager to Initialize Structure

**Update: src/cli/config.ts** (create this file)
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { ensureDirectoryStructure } from './directory-manager';

export interface QuestmaestroConfig {
  discoveryComplete: boolean;
  createdAt: string;
  lastUpdated: string;
  version: string;
}

const CONFIG_FILE = '.questmaestro';

/**
 * Loads or creates the questmaestro configuration
 */
export async function loadConfig(): Promise<QuestmaestroConfig> {
  // Ensure directory structure exists
  await ensureDirectoryStructure();
  
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(configData);
  } catch {
    // Create default config if doesn't exist
    const defaultConfig: QuestmaestroConfig = {
      discoveryComplete: false,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };
    
    await saveConfig(defaultConfig);
    return defaultConfig;
  }
}

/**
 * Saves the questmaestro configuration
 */
export async function saveConfig(config: QuestmaestroConfig): Promise<void> {
  config.lastUpdated = new Date().toISOString();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Updates a specific config field
 */
export async function updateConfig(updates: Partial<QuestmaestroConfig>): Promise<void> {
  const config = await loadConfig();
  const updatedConfig = { ...config, ...updates };
  await saveConfig(updatedConfig);
}
```

### 3. Create Discovery Check Stub

**File: src/cli/discovery.ts**
```typescript
import { loadConfig } from './config';

export async function checkProjectDiscovery(): Promise<void> {
  console.log('🔍 Checking project discovery status...');
  // TODO: Implement in task 14
  console.log('(Discovery check implementation pending)');
}
```

### 4. Create README for Directory Structure

**File: questmaestro/README.md**
```markdown
# Questmaestro Working Directory

This directory contains all questmaestro operational files.

## Structure

- `discovery/` - Voidpoker project discovery reports
- `active/` - Currently active quest folders
- `completed/` - Successfully completed quests
- `abandoned/` - Abandoned or failed quests
- `retros/` - Quest retrospectives and learnings
- `lore/` - Accumulated wisdom, patterns, and gotchas

## Quest Folder Structure

Each quest folder contains:
- `quest.json` - Quest metadata and state
- `*-report.json` - Agent reports (numbered sequentially)

Example:
```
active/
└── 01-add-authentication/
    ├── quest.json
    ├── 001-pathseeker-report.json
    ├── 002-codeweaver-report.json
    └── 003-siegemaster-report.json
```

## Notes

- This directory is git-ignored by default
- Quest folders are moved wholesale between active/completed/abandoned
- Reports are numbered sequentially within each quest
```

## Unit Tests

**File: src/cli/directory-manager.test.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ensureDirectoryStructure,
  createQuestDirectory,
  moveQuestToCompleted,
  getActiveQuestFolders,
  DIRECTORIES,
  QUESTMAESTRO_DIR,
} from './directory-manager';

// Mock fs
jest.mock('fs/promises');

describe('DirectoryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));
  });

  describe('ensureDirectoryStructure', () => {
    it('should create all required directories', async () => {
      await ensureDirectoryStructure();

      // Check main directory created
      expect(fs.mkdir).toHaveBeenCalledWith(QUESTMAESTRO_DIR, { recursive: true });

      // Check subdirectories created
      for (const dir of Object.values(DIRECTORIES)) {
        expect(fs.mkdir).toHaveBeenCalledWith(dir, { recursive: true });
      }
    });

    it('should create .gitignore file', async () => {
      await ensureDirectoryStructure();

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(QUESTMAESTRO_DIR, '.gitignore'),
        expect.stringContaining('active/')
      );
    });

    it('should create .gitkeep files', async () => {
      await ensureDirectoryStructure();

      for (const dir of Object.values(DIRECTORIES)) {
        expect(fs.writeFile).toHaveBeenCalledWith(
          path.join(dir, '.gitkeep'),
          ''
        );
      }
    });
  });

  describe('createQuestDirectory', () => {
    it('should create quest folder with proper naming', async () => {
      const folder = await createQuestDirectory('01', 'Add Authentication');

      expect(folder).toBe('01-add-authentication');
      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(DIRECTORIES.active, '01-add-authentication'),
        { recursive: true }
      );
    });

    it('should handle multi-word quest titles', async () => {
      const folder = await createQuestDirectory('02', 'Implement User Login Flow');

      expect(folder).toBe('02-implement-user-login-flow');
    });
  });

  describe('moveQuestToCompleted', () => {
    it('should move quest from active to completed', async () => {
      (fs.rename as jest.Mock).mockResolvedValue(undefined);

      await moveQuestToCompleted('01-add-authentication');

      expect(fs.rename).toHaveBeenCalledWith(
        path.join(DIRECTORIES.active, '01-add-authentication'),
        path.join(DIRECTORIES.completed, '01-add-authentication')
      );
    });
  });

  describe('getActiveQuestFolders', () => {
    it('should return list of active quest folders', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: '01-add-auth', isDirectory: () => true },
        { name: '02-refactor', isDirectory: () => true },
        { name: 'quest.json', isDirectory: () => false },
      ]);

      const folders = await getActiveQuestFolders();

      expect(folders).toEqual(['01-add-auth', '02-refactor']);
    });

    it('should return empty array if directory not found', async () => {
      (fs.readdir as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      const folders = await getActiveQuestFolders();

      expect(folders).toEqual([]);
    });
  });
});
```

**File: src/cli/config.test.ts**
```typescript
import * as fs from 'fs/promises';
import { loadConfig, saveConfig, updateConfig } from './config';
import { ensureDirectoryStructure } from './directory-manager';

jest.mock('fs/promises');
jest.mock('./directory-manager');

describe('Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ensureDirectoryStructure as jest.Mock).mockResolvedValue(undefined);
  });

  describe('loadConfig', () => {
    it('should load existing config', async () => {
      const mockConfig = {
        discoveryComplete: true,
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-02',
        version: '1.0.0',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await loadConfig();

      expect(config).toEqual(mockConfig);
      expect(ensureDirectoryStructure).toHaveBeenCalled();
    });

    it('should create default config if not exists', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const config = await loadConfig();

      expect(config.discoveryComplete).toBe(false);
      expect(config.version).toBe('1.0.0');
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('should update specific fields', async () => {
      const mockConfig = {
        discoveryComplete: false,
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01',
        version: '1.0.0',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await updateConfig({ discoveryComplete: true });

      expect(fs.writeFile).toHaveBeenCalledWith(
        '.questmaestro',
        expect.stringContaining('"discoveryComplete": true')
      );
    });
  });
});
```

## Validation Criteria

1. **Directory Structure**
   - [ ] All directories created on first run
   - [ ] .gitignore properly configured
   - [ ] .gitkeep files preserve empty directories

2. **Quest Directory Management**
   - [ ] Quest folders created with proper naming
   - [ ] Folders can be moved between states
   - [ ] Directory listing works correctly

3. **Configuration**
   - [ ] Config file created if not exists
   - [ ] Config can be loaded and saved
   - [ ] Updates preserve existing data

4. **Error Handling**
   - [ ] Handles missing directories gracefully
   - [ ] Handles file system errors
   - [ ] Returns sensible defaults

## Next Steps

After completing this task:
1. Run `npm test` to verify all tests pass
2. Test directory creation by running the CLI
3. Verify questmaestro directory structure is created
4. Check .questmaestro config file is created
5. Proceed to [03-config-management.md](03-config-management.md)