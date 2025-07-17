# Task 20: Clean Command

## Objective
Implement the clean command to remove old completed and abandoned quests based on age or count limits.

## Dependencies
- Task 02: Project Structure (for directory management)
- Task 05: Quest Commands (for command integration)
- Task 18: Quest Completion (for completed/abandoned quest handling)

## Implementation

### 1. Clean Command Handler

**File: src/cli/commands/clean.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { DIRECTORIES } from '../directory-manager';
import { loadQuest } from '../quest-storage';
import chalk from 'chalk';
import { prompt } from 'inquirer';

export interface CleanOptions {
  daysOld?: number;
  keepRecent?: number;
  includeCompleted?: boolean;
  includeAbandoned?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

export interface CleanResult {
  completed: {
    total: number;
    removed: string[];
    kept: string[];
  };
  abandoned: {
    total: number;
    removed: string[];
    kept: string[];
  };
  retrospectives: {
    removed: number;
  };
  freedSpace: number;
}

/**
 * Cleans old completed and abandoned quests
 */
export async function cleanCommand(options: CleanOptions): Promise<void> {
  console.log(chalk.cyan('\n🧹 Cleaning old quests...\n'));
  
  // Set defaults
  const config = {
    daysOld: options.daysOld ?? 30,
    keepRecent: options.keepRecent ?? 10,
    includeCompleted: options.includeCompleted ?? true,
    includeAbandoned: options.includeAbandoned ?? true,
    dryRun: options.dryRun ?? false,
    force: options.force ?? false,
  };
  
  // Find quests to clean
  const toClean = await findQuestsToClean(config);
  
  if (toClean.completed.removed.length === 0 && toClean.abandoned.removed.length === 0) {
    console.log(chalk.gray('No quests to clean based on current criteria.'));
    return;
  }
  
  // Show what will be cleaned
  displayCleanPreview(toClean, config);
  
  if (config.dryRun) {
    console.log(chalk.yellow('\n🔍 Dry run complete. No files were deleted.'));
    return;
  }
  
  // Confirm unless forced
  if (!config.force) {
    const totalToRemove = toClean.completed.removed.length + toClean.abandoned.removed.length;
    const { proceed } = await prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Remove ${totalToRemove} quest(s) and associated files?`,
        default: false,
      },
    ]);
    
    if (!proceed) {
      console.log(chalk.gray('Clean cancelled.'));
      return;
    }
  }
  
  // Perform cleaning
  const result = await performClean(toClean, config);
  
  // Display results
  displayCleanResults(result);
}

/**
 * Finds quests that match cleaning criteria
 */
async function findQuestsToClean(config: Required<CleanOptions>): Promise<CleanResult> {
  const result: CleanResult = {
    completed: { total: 0, removed: [], kept: [] },
    abandoned: { total: 0, removed: [], kept: [] },
    retrospectives: { removed: 0 },
    freedSpace: 0,
  };
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.daysOld);
  
  // Check completed quests
  if (config.includeCompleted) {
    const completed = await analyzeQuestDirectory(
      DIRECTORIES.completed,
      cutoffDate,
      config.keepRecent
    );
    result.completed = completed;
  }
  
  // Check abandoned quests
  if (config.includeAbandoned) {
    const abandoned = await analyzeQuestDirectory(
      DIRECTORIES.abandoned,
      cutoffDate,
      config.keepRecent
    );
    result.abandoned = abandoned;
  }
  
  // Check retrospectives
  const oldRetros = await findOldRetrospectives(cutoffDate);
  result.retrospectives.removed = oldRetros.length;
  
  return result;
}

/**
 * Analyzes a quest directory for cleaning
 */
async function analyzeQuestDirectory(
  directory: string,
  cutoffDate: Date,
  keepRecent: number
): Promise<{
  total: number;
  removed: string[];
  kept: string[];
}> {
  const result = {
    total: 0,
    removed: [] as string[],
    kept: [] as string[],
  };
  
  try {
    const folders = await fs.readdir(directory);
    result.total = folders.length;
    
    // Sort by modification time (newest first)
    const folderStats = await Promise.all(
      folders.map(async (folder) => {
        const folderPath = path.join(directory, folder);
        const stats = await fs.stat(folderPath);
        
        // Try to load quest for more accurate dates
        let questDate = stats.mtime;
        try {
          const quest = await loadQuest(folderPath);
          questDate = new Date(quest.completedAt || quest.abandonedAt || quest.lastUpdated);
        } catch {
          // Use folder stats if quest can't be loaded
        }
        
        return {
          folder,
          path: folderPath,
          date: questDate,
        };
      })
    );
    
    // Sort by date (newest first)
    folderStats.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Keep the most recent N quests
    const toKeep = folderStats.slice(0, keepRecent);
    const remaining = folderStats.slice(keepRecent);
    
    // From remaining, remove those older than cutoff
    for (const item of remaining) {
      if (item.date < cutoffDate) {
        result.removed.push(item.folder);
      } else {
        result.kept.push(item.folder);
      }
    }
    
    // Add explicitly kept items
    result.kept.push(...toKeep.map(item => item.folder));
    
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(chalk.red(`Error reading ${directory}: ${error.message}`));
    }
  }
  
  return result;
}

/**
 * Finds old retrospective files
 */
async function findOldRetrospectives(cutoffDate: Date): Promise<string[]> {
  const oldFiles: string[] = [];
  
  try {
    const files = await fs.readdir(DIRECTORIES.retros);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(DIRECTORIES.retros, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          oldFiles.push(file);
        }
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(chalk.red(`Error reading retrospectives: ${error.message}`));
    }
  }
  
  return oldFiles;
}

/**
 * Displays preview of what will be cleaned
 */
function displayCleanPreview(result: CleanResult, config: Required<CleanOptions>): void {
  console.log(chalk.bold('Clean Preview:\n'));
  
  console.log(chalk.gray(`Criteria:`));
  console.log(`  • Remove quests older than ${config.daysOld} days`);
  console.log(`  • Keep at least ${config.keepRecent} recent quests per category`);
  
  if (config.includeCompleted && result.completed.total > 0) {
    console.log(chalk.green(`\nCompleted Quests:`));
    console.log(`  • Total: ${result.completed.total}`);
    console.log(`  • To remove: ${result.completed.removed.length}`);
    console.log(`  • To keep: ${result.completed.kept.length}`);
    
    if (result.completed.removed.length > 0) {
      console.log(chalk.gray(`\n  Removing:`));
      result.completed.removed.slice(0, 5).forEach(q => 
        console.log(chalk.gray(`    - ${q}`))
      );
      if (result.completed.removed.length > 5) {
        console.log(chalk.gray(`    ... and ${result.completed.removed.length - 5} more`));
      }
    }
  }
  
  if (config.includeAbandoned && result.abandoned.total > 0) {
    console.log(chalk.yellow(`\nAbandoned Quests:`));
    console.log(`  • Total: ${result.abandoned.total}`);
    console.log(`  • To remove: ${result.abandoned.removed.length}`);
    console.log(`  • To keep: ${result.abandoned.kept.length}`);
    
    if (result.abandoned.removed.length > 0) {
      console.log(chalk.gray(`\n  Removing:`));
      result.abandoned.removed.slice(0, 5).forEach(q => 
        console.log(chalk.gray(`    - ${q}`))
      );
      if (result.abandoned.removed.length > 5) {
        console.log(chalk.gray(`    ... and ${result.abandoned.removed.length - 5} more`));
      }
    }
  }
  
  if (result.retrospectives.removed > 0) {
    console.log(chalk.cyan(`\nRetrospectives:`));
    console.log(`  • To remove: ${result.retrospectives.removed} old files`);
  }
}

/**
 * Performs the actual cleaning
 */
async function performClean(
  toClean: CleanResult,
  config: Required<CleanOptions>
): Promise<CleanResult> {
  let freedSpace = 0;
  
  // Remove completed quests
  if (config.includeCompleted) {
    for (const folder of toClean.completed.removed) {
      const folderPath = path.join(DIRECTORIES.completed, folder);
      try {
        const size = await getFolderSize(folderPath);
        await fs.rm(folderPath, { recursive: true, force: true });
        freedSpace += size;
      } catch (error) {
        console.error(chalk.red(`Failed to remove ${folder}: ${error.message}`));
      }
    }
  }
  
  // Remove abandoned quests
  if (config.includeAbandoned) {
    for (const folder of toClean.abandoned.removed) {
      const folderPath = path.join(DIRECTORIES.abandoned, folder);
      try {
        const size = await getFolderSize(folderPath);
        await fs.rm(folderPath, { recursive: true, force: true });
        freedSpace += size;
      } catch (error) {
        console.error(chalk.red(`Failed to remove ${folder}: ${error.message}`));
      }
    }
  }
  
  // Remove old retrospectives
  const retroFiles = await findOldRetrospectives(
    new Date(Date.now() - config.daysOld * 24 * 60 * 60 * 1000)
  );
  
  for (const file of retroFiles) {
    const filePath = path.join(DIRECTORIES.retros, file);
    try {
      const stats = await fs.stat(filePath);
      await fs.unlink(filePath);
      freedSpace += stats.size;
    } catch (error) {
      console.error(chalk.red(`Failed to remove ${file}: ${error.message}`));
    }
  }
  
  toClean.freedSpace = freedSpace;
  return toClean;
}

/**
 * Gets the total size of a folder
 */
async function getFolderSize(folderPath: string): Promise<number> {
  let totalSize = 0;
  
  async function calculateSize(currentPath: string): Promise<void> {
    const items = await fs.readdir(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        await calculateSize(itemPath);
      } else {
        totalSize += stats.size;
      }
    }
  }
  
  await calculateSize(folderPath);
  return totalSize;
}

/**
 * Displays cleaning results
 */
function displayCleanResults(result: CleanResult): void {
  console.log(chalk.green('\n✅ Cleaning complete!\n'));
  
  const totalRemoved = 
    result.completed.removed.length + 
    result.abandoned.removed.length + 
    result.retrospectives.removed;
  
  console.log(chalk.bold('Summary:'));
  console.log(`  • Quests removed: ${result.completed.removed.length + result.abandoned.removed.length}`);
  console.log(`  • Retrospectives removed: ${result.retrospectives.removed}`);
  console.log(`  • Total items removed: ${totalRemoved}`);
  console.log(`  • Space freed: ${formatBytes(result.freedSpace)}`);
  
  console.log(chalk.gray('\nRemaining quests:'));
  console.log(`  • Completed: ${result.completed.kept.length}`);
  console.log(`  • Abandoned: ${result.abandoned.kept.length}`);
}

/**
 * Formats bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}
```

### 2. Archive Command Extension

**File: src/cli/commands/archive.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { DIRECTORIES } from '../directory-manager';
import { loadQuest } from '../quest-storage';
import chalk from 'chalk';
import { prompt } from 'inquirer';
import * as archiver from 'archiver';
import { createWriteStream } from 'fs';

export interface ArchiveOptions {
  output?: string;
  includeCompleted?: boolean;
  includeAbandoned?: boolean;
  includeRetros?: boolean;
  olderThan?: number;
  compress?: boolean;
}

/**
 * Archives old quests to a backup file
 */
export async function archiveCommand(options: ArchiveOptions): Promise<void> {
  console.log(chalk.cyan('\n📦 Archiving old quests...\n'));
  
  const config = {
    output: options.output ?? `questmaestro-archive-${new Date().toISOString().split('T')[0]}.tar.gz`,
    includeCompleted: options.includeCompleted ?? true,
    includeAbandoned: options.includeAbandoned ?? true,
    includeRetros: options.includeRetros ?? true,
    olderThan: options.olderThan ?? 90, // days
    compress: options.compress ?? true,
  };
  
  // Find quests to archive
  const toArchive = await findQuestsToArchive(config);
  
  if (toArchive.totalCount === 0) {
    console.log(chalk.gray('No quests to archive based on current criteria.'));
    return;
  }
  
  // Show what will be archived
  displayArchivePreview(toArchive, config);
  
  // Confirm
  const { proceed } = await prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: `Archive ${toArchive.totalCount} items to ${config.output}?`,
      default: true,
    },
  ]);
  
  if (!proceed) {
    console.log(chalk.gray('Archive cancelled.'));
    return;
  }
  
  // Create archive
  await createArchive(toArchive, config);
}

interface ArchiveContents {
  completed: string[];
  abandoned: string[];
  retrospectives: string[];
  totalCount: number;
  totalSize: number;
}

/**
 * Finds content to archive
 */
async function findQuestsToArchive(config: any): Promise<ArchiveContents> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.olderThan);
  
  const result: ArchiveContents = {
    completed: [],
    abandoned: [],
    retrospectives: [],
    totalCount: 0,
    totalSize: 0,
  };
  
  // Find old completed quests
  if (config.includeCompleted) {
    result.completed = await findOldQuests(DIRECTORIES.completed, cutoffDate);
  }
  
  // Find old abandoned quests
  if (config.includeAbandoned) {
    result.abandoned = await findOldQuests(DIRECTORIES.abandoned, cutoffDate);
  }
  
  // Find old retrospectives
  if (config.includeRetros) {
    result.retrospectives = await findOldRetrospectivesForArchive(cutoffDate);
  }
  
  result.totalCount = 
    result.completed.length + 
    result.abandoned.length + 
    result.retrospectives.length;
  
  return result;
}

/**
 * Finds old quests in a directory
 */
async function findOldQuests(directory: string, cutoffDate: Date): Promise<string[]> {
  const oldQuests: string[] = [];
  
  try {
    const folders = await fs.readdir(directory);
    
    for (const folder of folders) {
      const folderPath = path.join(directory, folder);
      const stats = await fs.stat(folderPath);
      
      // Check quest date
      try {
        const quest = await loadQuest(folderPath);
        const questDate = new Date(quest.completedAt || quest.abandonedAt || quest.lastUpdated);
        
        if (questDate < cutoffDate) {
          oldQuests.push(folder);
        }
      } catch {
        // Use folder stats if quest can't be loaded
        if (stats.mtime < cutoffDate) {
          oldQuests.push(folder);
        }
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(chalk.red(`Error reading ${directory}: ${error.message}`));
    }
  }
  
  return oldQuests;
}

/**
 * Finds old retrospective files for archiving
 */
async function findOldRetrospectivesForArchive(cutoffDate: Date): Promise<string[]> {
  const oldFiles: string[] = [];
  
  try {
    const files = await fs.readdir(DIRECTORIES.retros);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(DIRECTORIES.retros, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          oldFiles.push(file);
        }
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(chalk.red(`Error reading retrospectives: ${error.message}`));
    }
  }
  
  return oldFiles;
}

/**
 * Displays archive preview
 */
function displayArchivePreview(contents: ArchiveContents, config: any): void {
  console.log(chalk.bold('Archive Preview:\n'));
  
  console.log(`Output file: ${config.output}`);
  console.log(`Compression: ${config.compress ? 'Yes' : 'No'}`);
  console.log(`Including quests older than ${config.olderThan} days\n`);
  
  if (contents.completed.length > 0) {
    console.log(chalk.green(`Completed quests: ${contents.completed.length}`));
  }
  
  if (contents.abandoned.length > 0) {
    console.log(chalk.yellow(`Abandoned quests: ${contents.abandoned.length}`));
  }
  
  if (contents.retrospectives.length > 0) {
    console.log(chalk.cyan(`Retrospectives: ${contents.retrospectives.length}`));
  }
  
  console.log(chalk.gray(`\nTotal items to archive: ${contents.totalCount}`));
}

/**
 * Creates the archive file
 */
async function createArchive(contents: ArchiveContents, config: any): Promise<void> {
  const output = createWriteStream(config.output);
  const archive = archiver(config.compress ? 'tar' : 'tar', {
    gzip: config.compress,
    gzipOptions: { level: 9 },
  });
  
  output.on('close', () => {
    const size = archive.pointer();
    console.log(chalk.green(`\n✅ Archive created successfully!`));
    console.log(`   File: ${config.output}`);
    console.log(`   Size: ${formatBytes(size)}`);
    console.log(`   Items: ${contents.totalCount}`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  
  // Add completed quests
  for (const quest of contents.completed) {
    const questPath = path.join(DIRECTORIES.completed, quest);
    archive.directory(questPath, `completed/${quest}`);
  }
  
  // Add abandoned quests
  for (const quest of contents.abandoned) {
    const questPath = path.join(DIRECTORIES.abandoned, quest);
    archive.directory(questPath, `abandoned/${quest}`);
  }
  
  // Add retrospectives
  for (const retro of contents.retrospectives) {
    const retroPath = path.join(DIRECTORIES.retros, retro);
    archive.file(retroPath, { name: `retrospectives/${retro}` });
  }
  
  // Add metadata
  const metadata = {
    created: new Date().toISOString(),
    questmaestroVersion: '1.0.0',
    contents: {
      completed: contents.completed.length,
      abandoned: contents.abandoned.length,
      retrospectives: contents.retrospectives.length,
    },
  };
  
  archive.append(JSON.stringify(metadata, null, 2), { name: 'archive-metadata.json' });
  
  await archive.finalize();
}

/**
 * Formats bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}
```

## Unit Tests

**File: src/cli/commands/clean.test.ts**
```typescript
import * as fs from 'fs/promises';
import { cleanCommand } from './clean';
import { DIRECTORIES } from '../directory-manager';
import { prompt } from 'inquirer';

jest.mock('fs/promises');
jest.mock('inquirer');

describe('CleanCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup directory structure
    (fs.readdir as jest.Mock).mockImplementation((dir) => {
      if (dir.includes('completed')) {
        return Promise.resolve(['01-old-quest', '02-recent-quest', '03-very-old']);
      }
      if (dir.includes('abandoned')) {
        return Promise.resolve(['04-old-abandoned', '05-recent-abandoned']);
      }
      if (dir.includes('retros')) {
        return Promise.resolve(['old-retro.md', 'recent-retro.md']);
      }
      return Promise.resolve([]);
    });
    
    // Mock stat to return different dates
    (fs.stat as jest.Mock).mockImplementation((path) => {
      if (path.includes('old') || path.includes('very-old')) {
        return Promise.resolve({
          mtime: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days old
          size: 1024,
        });
      }
      return Promise.resolve({
        mtime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days old
        size: 1024,
      });
    });
  });

  describe('cleanCommand', () => {
    it('should identify old quests to clean', async () => {
      (prompt as unknown as jest.Mock).mockResolvedValue({ proceed: false });

      await cleanCommand({
        daysOld: 30,
        keepRecent: 1,
        dryRun: false,
      });

      expect(fs.readdir).toHaveBeenCalledWith(DIRECTORIES.completed);
      expect(fs.readdir).toHaveBeenCalledWith(DIRECTORIES.abandoned);
    });

    it('should respect keepRecent limit', async () => {
      (prompt as unknown as jest.Mock).mockResolvedValue({ proceed: false });

      await cleanCommand({
        daysOld: 1, // All are older than 1 day
        keepRecent: 2,
        dryRun: false,
      });

      // Should keep 2 most recent even if older than threshold
      expect(prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('Remove 1 quest'),
          }),
        ])
      );
    });

    it('should perform dry run without deleting', async () => {
      (fs.rm as jest.Mock).mockResolvedValue(undefined);

      await cleanCommand({
        daysOld: 30,
        dryRun: true,
      });

      expect(fs.rm).not.toHaveBeenCalled();
      expect(prompt).not.toHaveBeenCalled();
    });

    it('should skip prompt with force flag', async () => {
      (fs.rm as jest.Mock).mockResolvedValue(undefined);

      await cleanCommand({
        daysOld: 30,
        force: true,
      });

      expect(prompt).not.toHaveBeenCalled();
      expect(fs.rm).toHaveBeenCalled();
    });

    it('should clean only selected categories', async () => {
      (prompt as unknown as jest.Mock).mockResolvedValue({ proceed: true });
      (fs.rm as jest.Mock).mockResolvedValue(undefined);

      await cleanCommand({
        daysOld: 30,
        includeCompleted: true,
        includeAbandoned: false,
      });

      expect(fs.readdir).toHaveBeenCalledWith(DIRECTORIES.completed);
      expect(fs.readdir).not.toHaveBeenCalledWith(DIRECTORIES.abandoned);
    });

    it('should calculate freed space', async () => {
      (prompt as unknown as jest.Mock).mockResolvedValue({ proceed: true });
      (fs.rm as jest.Mock).mockResolvedValue(undefined);
      
      // Mock folder size calculation
      (fs.readdir as jest.Mock).mockResolvedValue(['file1.txt', 'file2.txt']);
      (fs.stat as jest.Mock).mockImplementation((path) => {
        if (path.includes('.txt')) {
          return Promise.resolve({
            isDirectory: () => false,
            size: 1024,
          });
        }
        return Promise.resolve({
          isDirectory: () => true,
          mtime: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        });
      });

      await cleanCommand({
        daysOld: 30,
        force: true,
      });

      // Should calculate and display freed space
      expect(fs.stat).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (prompt as unknown as jest.Mock).mockResolvedValue({ proceed: true });
      (fs.rm as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      await cleanCommand({
        daysOld: 30,
        force: true,
      });

      // Should continue despite errors
      expect(fs.rm).toHaveBeenCalled();
    });
  });
});
```

**File: src/cli/commands/archive.test.ts**
```typescript
import * as fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { archiveCommand } from './archive';
import { prompt } from 'inquirer';
import * as archiver from 'archiver';

jest.mock('fs/promises');
jest.mock('fs');
jest.mock('inquirer');
jest.mock('archiver');

describe('ArchiveCommand', () => {
  let mockArchive: any;
  let mockOutput: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock archive
    mockArchive = {
      pipe: jest.fn(),
      directory: jest.fn(),
      file: jest.fn(),
      append: jest.fn(),
      finalize: jest.fn().mockResolvedValue(undefined),
      pointer: jest.fn().mockReturnValue(10240),
      on: jest.fn(),
    };
    
    mockOutput = {
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(callback, 100);
        }
      }),
    };
    
    (archiver as unknown as jest.Mock).mockReturnValue(mockArchive);
    (createWriteStream as jest.Mock).mockReturnValue(mockOutput);
    
    // Setup directory structure
    (fs.readdir as jest.Mock).mockImplementation((dir) => {
      if (dir.includes('completed')) {
        return Promise.resolve(['01-old-quest', '02-very-old']);
      }
      if (dir.includes('abandoned')) {
        return Promise.resolve(['03-old-abandoned']);
      }
      if (dir.includes('retros')) {
        return Promise.resolve(['old-retro.md']);
      }
      return Promise.resolve([]);
    });
    
    // Mock old dates
    (fs.stat as jest.Mock).mockResolvedValue({
      mtime: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days old
    });
  });

  describe('archiveCommand', () => {
    it('should find old items to archive', async () => {
      (prompt as unknown as jest.Mock).mockResolvedValue({ proceed: false });

      await archiveCommand({
        olderThan: 90,
      });

      expect(fs.readdir).toHaveBeenCalled();
    });

    it('should create compressed archive', async () => {
      (prompt as unknown as jest.Mock).mockResolvedValue({ proceed: true });

      await archiveCommand({
        olderThan: 90,
        compress: true,
      });

      expect(archiver).toHaveBeenCalledWith('tar', expect.objectContaining({
        gzip: true,
      }));
      
      expect(mockArchive.directory).toHaveBeenCalledWith(
        expect.stringContaining('01-old-quest'),
        'completed/01-old-quest'
      );
    });

    it('should include metadata in archive', async () => {
      (prompt as unknown as jest.Mock).mockResolvedValue({ proceed: true });

      await archiveCommand({
        olderThan: 90,
      });

      expect(mockArchive.append).toHaveBeenCalledWith(
        expect.stringContaining('questmaestroVersion'),
        { name: 'archive-metadata.json' }
      );
    });

    it('should respect category selection', async () => {
      (prompt as unknown as jest.Mock).mockResolvedValue({ proceed: true });

      await archiveCommand({
        olderThan: 90,
        includeCompleted: true,
        includeAbandoned: false,
        includeRetros: false,
      });

      expect(mockArchive.directory).toHaveBeenCalledWith(
        expect.stringContaining('completed'),
        expect.any(String)
      );
      
      expect(mockArchive.directory).not.toHaveBeenCalledWith(
        expect.stringContaining('abandoned'),
        expect.any(String)
      );
    });

    it('should handle empty archive gracefully', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([]);
      
      await archiveCommand({
        olderThan: 90,
      });

      expect(mockArchive.finalize).not.toHaveBeenCalled();
    });
  });
});
```

## Validation Criteria

1. **Clean Command**
   - [ ] Identifies old quests by date
   - [ ] Respects keepRecent limit
   - [ ] Supports dry run mode
   - [ ] Calculates freed space
   - [ ] Prompts for confirmation

2. **Archive Command**
   - [ ] Creates tar.gz archives
   - [ ] Includes metadata
   - [ ] Preserves directory structure
   - [ ] Handles large archives
   - [ ] Shows progress

3. **Selection Criteria**
   - [ ] Age-based filtering
   - [ ] Category selection
   - [ ] Count-based limits
   - [ ] Combines criteria properly

4. **Error Handling**
   - [ ] Permission errors
   - [ ] Missing directories
   - [ ] Failed deletions
   - [ ] Archive creation errors

5. **User Experience**
   - [ ] Clear preview of actions
   - [ ] Confirmation prompts
   - [ ] Progress feedback
   - [ ] Summary of results

## Next Steps

After completing this task:
1. Test clean command with various options
2. Verify archive creation
3. Test space calculation
4. Check error handling
5. Proceed to [21-unit-tests.md](21-unit-tests.md)