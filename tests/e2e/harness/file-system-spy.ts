/**
 * PURPOSE: Tracks file system changes in a project directory for E2E test assertions
 *
 * USAGE:
 * const spy = createFileSystemSpy(projectPath);
 * spy.startTracking();
 * // ... run CLI commands ...
 * expect(spy.wasCreated('.dungeonmaster-quests/001-my-quest/quest.json')).toBe(true);
 * const quests = spy.findQuestsWithName('my-quest');
 * expect(quests).toHaveLength(1);
 *
 * Provides:
 * - File creation/modification tracking
 * - Quest file discovery
 * - File content inspection
 */

import { existsSync, readdirSync, readFileSync, statSync, type Stats } from 'fs';
import { join, basename } from 'path';

/**
 * Quest file structure
 */
export interface QuestFile {
  /** Full path to the quest folder */
  folderPath: string;
  /** Quest folder name (e.g., "001-my-quest") */
  folderName: string;
  /** Quest number prefix (e.g., "001") */
  number: string;
  /** Quest name slug (e.g., "my-quest") */
  nameSlug: string;
  /** Path to quest.json */
  questJsonPath: string;
  /** Whether quest.json exists */
  hasQuestJson: boolean;
  /** Parsed quest.json content (if exists) */
  questData: QuestData | null;
}

/**
 * Quest JSON structure (basic fields)
 * Based on questContract from @dungeonmaster/shared
 */
export interface QuestData {
  id?: string;
  /** Quest title (from questContract - this is the primary name field) */
  title?: string;
  /** @deprecated Quest contract uses 'title', not 'name' */
  name?: string;
  folder?: string;
  status?: string;
  createdAt?: string;
  userRequest?: string;
  [key: string]: unknown;
}

/**
 * File change record
 */
export interface FileChange {
  path: string;
  type: 'created' | 'modified' | 'deleted';
  timestamp: number;
}

/**
 * Snapshot of file system state
 */
export interface FileSnapshot {
  /** Map of file paths to modification times */
  files: Map<string, number>;
  /** Timestamp when snapshot was taken */
  timestamp: number;
}

/**
 * File system spy for tracking changes
 */
export interface FileSystemSpy {
  /** Start tracking file system changes */
  startTracking: () => void;
  /** Stop tracking and return changes */
  stopTracking: () => FileChange[];
  /** Get all changes since tracking started */
  getChanges: () => FileChange[];
  /** Check if a specific file was created */
  wasCreated: (relativePath: string) => boolean;
  /** Check if a specific file was modified */
  wasModified: (relativePath: string) => boolean;
  /** Check if a specific file was deleted */
  wasDeleted: (relativePath: string) => boolean;
  /** Get all created files */
  getCreatedFiles: () => string[];
  /** Get all modified files */
  getModifiedFiles: () => string[];
  /** Get all deleted files */
  getDeletedFiles: () => string[];
  /** Find quest folders matching a name pattern */
  findQuestsWithName: (namePattern: string) => QuestFile[];
  /** Get all quest folders in .dungeonmaster-quests/ */
  getAllQuests: () => QuestFile[];
  /** Read file content from testbed */
  readFile: (relativePath: string) => string | null;
  /** Check if file exists in testbed */
  fileExists: (relativePath: string) => boolean;
  /** Reset tracking state */
  reset: () => void;
}

// Quest storage directory
const QUEST_DIR = '.dungeonmaster-quests';

// Quest folder pattern: NNN-name-slug
const QUEST_FOLDER_PATTERN = /^(\d{3})-(.+)$/;

/**
 * Creates a snapshot of all files in a directory recursively
 */
const createSnapshot = (dirPath: string): FileSnapshot => {
  const files = new Map<string, number>();

  const scanDir = (currentPath: string): void => {
    if (!existsSync(currentPath)) return;

    try {
      const entries = readdirSync(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile()) {
          try {
            const stats: Stats = statSync(fullPath);
            files.set(fullPath, stats.mtimeMs);
          } catch (_e) {
            // File may have been deleted during scan
          }
        }
      }
    } catch (_e) {
      // Directory may not exist or be accessible
    }
  };

  scanDir(dirPath);

  return {
    files,
    timestamp: Date.now(),
  };
};

/**
 * Creates a file system spy bound to a project directory
 *
 * @param projectPath - Absolute path to the project directory to monitor
 */
export const createFileSystemSpy = (projectPath: string): FileSystemSpy => {
  let baseSnapshot: FileSnapshot | null = null;
  let isTracking = false;
  const changes: FileChange[] = [];

  /**
   * Compares current state to base snapshot and updates changes
   */
  const detectChanges = (): void => {
    if (baseSnapshot === null) return;

    const currentSnapshot = createSnapshot(projectPath);

    // Check for created and modified files
    currentSnapshot.files.forEach((mtime, path) => {
      const baseMtime = baseSnapshot!.files.get(path);
      const relativePath = path.replace(projectPath + '/', '');

      if (baseMtime === undefined) {
        // File didn't exist in base snapshot - created
        if (!changes.some((c) => c.path === relativePath && c.type === 'created')) {
          changes.push({
            path: relativePath,
            type: 'created',
            timestamp: Date.now(),
          });
        }
      } else if (mtime > baseMtime) {
        // File exists in both but was modified
        if (!changes.some((c) => c.path === relativePath && c.type === 'modified')) {
          changes.push({
            path: relativePath,
            type: 'modified',
            timestamp: Date.now(),
          });
        }
      }
    });

    // Check for deleted files
    baseSnapshot.files.forEach((_mtime, path) => {
      const relativePath = path.replace(projectPath + '/', '');
      if (!currentSnapshot.files.has(path)) {
        if (!changes.some((c) => c.path === relativePath && c.type === 'deleted')) {
          changes.push({
            path: relativePath,
            type: 'deleted',
            timestamp: Date.now(),
          });
        }
      }
    });
  };

  /**
   * Parses a quest folder into structured data
   */
  const parseQuestFolder = (folderPath: string): QuestFile | null => {
    const folderName = basename(folderPath);
    const match = QUEST_FOLDER_PATTERN.exec(folderName);

    if (match === null) return null;

    const questJsonPath = join(folderPath, 'quest.json');
    const hasQuestJson = existsSync(questJsonPath);

    let questData: QuestData | null = null;
    if (hasQuestJson) {
      try {
        const content = readFileSync(questJsonPath, 'utf-8');
        questData = JSON.parse(content) as QuestData;
      } catch (_e) {
        questData = null;
      }
    }

    return {
      folderPath,
      folderName,
      number: match[1]!,
      nameSlug: match[2]!,
      questJsonPath,
      hasQuestJson,
      questData,
    };
  };

  const spy: FileSystemSpy = {
    startTracking: (): void => {
      baseSnapshot = createSnapshot(projectPath);
      changes.length = 0;
      isTracking = true;
    },

    stopTracking: (): FileChange[] => {
      if (isTracking) {
        detectChanges();
      }
      isTracking = false;
      return [...changes];
    },

    getChanges: (): FileChange[] => {
      if (isTracking) {
        detectChanges();
      }
      return [...changes];
    },

    wasCreated: (relativePath: string): boolean => {
      if (isTracking) {
        detectChanges();
      }
      return changes.some((c) => c.path === relativePath && c.type === 'created');
    },

    wasModified: (relativePath: string): boolean => {
      if (isTracking) {
        detectChanges();
      }
      return changes.some((c) => c.path === relativePath && c.type === 'modified');
    },

    wasDeleted: (relativePath: string): boolean => {
      if (isTracking) {
        detectChanges();
      }
      return changes.some((c) => c.path === relativePath && c.type === 'deleted');
    },

    getCreatedFiles: (): string[] => {
      if (isTracking) {
        detectChanges();
      }
      return changes.filter((c) => c.type === 'created').map((c) => c.path);
    },

    getModifiedFiles: (): string[] => {
      if (isTracking) {
        detectChanges();
      }
      return changes.filter((c) => c.type === 'modified').map((c) => c.path);
    },

    getDeletedFiles: (): string[] => {
      if (isTracking) {
        detectChanges();
      }
      return changes.filter((c) => c.type === 'deleted').map((c) => c.path);
    },

    findQuestsWithName: (namePattern: string): QuestFile[] => {
      const questDir = join(projectPath, QUEST_DIR);
      if (!existsSync(questDir)) return [];

      const quests: QuestFile[] = [];
      const pattern = namePattern.toLowerCase();

      try {
        const entries = readdirSync(questDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;

          const quest = parseQuestFolder(join(questDir, entry.name));
          if (quest === null) continue;

          // Match by slug, quest data title, or quest data name (deprecated)
          if (
            quest.nameSlug.toLowerCase().includes(pattern) ||
            quest.questData?.title?.toLowerCase().includes(pattern) ||
            quest.questData?.name?.toLowerCase().includes(pattern)
          ) {
            quests.push(quest);
          }
        }
      } catch (_e) {
        // Quest directory doesn't exist or not accessible
      }

      return quests;
    },

    getAllQuests: (): QuestFile[] => {
      const questDir = join(projectPath, QUEST_DIR);
      if (!existsSync(questDir)) return [];

      const quests: QuestFile[] = [];

      try {
        const entries = readdirSync(questDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;

          const quest = parseQuestFolder(join(questDir, entry.name));
          if (quest !== null) {
            quests.push(quest);
          }
        }
      } catch (_e) {
        // Quest directory doesn't exist or not accessible
      }

      // Sort by number
      return quests.sort((a, b) => a.number.localeCompare(b.number));
    },

    readFile: (relativePath: string): string | null => {
      const fullPath = join(projectPath, relativePath);
      if (!existsSync(fullPath)) return null;

      try {
        return readFileSync(fullPath, 'utf-8');
      } catch (_e) {
        return null;
      }
    },

    fileExists: (relativePath: string): boolean => existsSync(join(projectPath, relativePath)),

    reset: (): void => {
      baseSnapshot = null;
      changes.length = 0;
      isTracking = false;
    },
  };

  return spy;
};

/**
 * Quest directory constant for external use
 */
export { QUEST_DIR };
