/**
 * File system operations wrapper for Questmaestro
 * Provides safe file operations with error handling
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileOperationResult, QuestFolderStructure } from '../types';

/**
 * FileSystem class for managing quest-related files
 */
export class FileSystem {
  private questFolder: string;

  constructor(questFolder: string = 'questmaestro') {
    this.questFolder = questFolder;
  }

  /**
   * Get the full folder structure paths
   */
  getFolderStructure(basePath: string = process.cwd()): QuestFolderStructure {
    const root = path.join(basePath, this.questFolder);

    return {
      root,
      active: path.join(root, 'active'),
      completed: path.join(root, 'completed'),
      abandoned: path.join(root, 'abandoned'),
      retros: path.join(root, 'retros'),
      lore: path.join(root, 'lore'),
      discovery: path.join(root, 'discovery'),
    };
  }

  /**
   * Initialize the quest folder structure
   */
  initializeFolderStructure(basePath?: string): FileOperationResult<void> {
    try {
      const structure = this.getFolderStructure(basePath);

      // Create all directories
      for (const folderPath of Object.values(structure)) {
        if (typeof folderPath === 'string') {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize folder structure: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if a quest folder exists
   */
  questExists(questFolder: string, basePath?: string): boolean {
    const structure = this.getFolderStructure(basePath);
    const questPath = path.join(structure.active, questFolder);

    try {
      const stats = fs.statSync(questPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Create a new quest folder
   */
  createQuestFolder(questFolder: string, basePath?: string): FileOperationResult<string> {
    try {
      const structure = this.getFolderStructure(basePath);
      const questPath = path.join(structure.active, questFolder);

      // Check if already exists
      if (this.questExists(questFolder, basePath)) {
        return {
          success: false,
          error: `Quest folder ${questFolder} already exists`,
        };
      }

      fs.mkdirSync(questPath, { recursive: true });

      return {
        success: true,
        data: questPath,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create quest folder: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Read a JSON file
   */
  readJson<T>(filePath: string): FileOperationResult<T> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as T;

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read JSON file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Write a JSON file
   */
  writeJson(filePath: string, data: unknown, pretty: boolean = true): FileOperationResult<void> {
    try {
      const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(filePath, content, 'utf-8');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write JSON file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Move a quest folder between states
   */
  moveQuest(
    questFolder: string,
    fromState: 'active' | 'completed' | 'abandoned',
    toState: 'active' | 'completed' | 'abandoned',
    basePath?: string,
  ): FileOperationResult<string> {
    try {
      const structure = this.getFolderStructure(basePath);
      const fromPath = path.join(structure[fromState], questFolder);
      const toPath = path.join(structure[toState], questFolder);

      // Check source exists
      if (!fs.existsSync(fromPath)) {
        return {
          success: false,
          error: `Quest folder ${questFolder} not found in ${fromState}`,
        };
      }

      // Check destination doesn't exist
      if (fs.existsSync(toPath)) {
        return {
          success: false,
          error: `Quest folder ${questFolder} already exists in ${toState}`,
        };
      }

      fs.renameSync(fromPath, toPath);

      return {
        success: true,
        data: toPath,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to move quest: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * List quest folders in a specific state
   */
  listQuests(
    state: 'active' | 'completed' | 'abandoned',
    basePath?: string,
  ): FileOperationResult<string[]> {
    try {
      const structure = this.getFolderStructure(basePath);
      const statePath = structure[state];

      // Ensure directory exists
      if (!fs.existsSync(statePath)) {
        return {
          success: true,
          data: [],
        };
      }

      const entries = fs.readdirSync(statePath, { withFileTypes: true });
      const folders = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort(); // Sort by name (which includes number prefix)

      return {
        success: true,
        data: folders,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list quests: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get the next quest number
   */
  getNextQuestNumber(basePath?: string): FileOperationResult<string> {
    try {
      // Get all quest folders from all states
      const activeQuests = this.listQuests('active', basePath);
      const completedQuests = this.listQuests('completed', basePath);
      const abandonedQuests = this.listQuests('abandoned', basePath);

      const allQuests: string[] = [
        ...(activeQuests.data || []),
        ...(completedQuests.data || []),
        ...(abandonedQuests.data || []),
      ];

      // Extract numbers from quest folders (e.g., "001-add-auth" -> 1)
      const numbers = allQuests
        .map((folder: string) => {
          const match = folder.match(/^(\d+)-/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((num) => !isNaN(num));

      // Find the highest number
      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

      // Return next number padded to 3 digits
      const nextNumber = (maxNumber + 1).toString().padStart(3, '0');

      return {
        success: true,
        data: nextNumber,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get next quest number: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Find quest folder by name or partial match
   */
  findQuest(
    searchTerm: string,
    basePath?: string,
  ): FileOperationResult<{ folder: string; state: 'active' | 'completed' | 'abandoned' }> {
    try {
      const states: Array<'active' | 'completed' | 'abandoned'> = [
        'active',
        'completed',
        'abandoned',
      ];

      for (const state of states) {
        const questsResult = this.listQuests(state, basePath);
        if (!questsResult.success || !questsResult.data) continue;

        // Try exact match first
        const exactMatch = questsResult.data.find(
          (folder) => folder === searchTerm || folder.endsWith(`-${searchTerm}`),
        );

        if (exactMatch) {
          return {
            success: true,
            data: { folder: exactMatch, state },
          };
        }

        // Try partial match
        const partialMatch = questsResult.data.find((folder) =>
          folder.toLowerCase().includes(searchTerm.toLowerCase()),
        );

        if (partialMatch) {
          return {
            success: true,
            data: { folder: partialMatch, state },
          };
        }
      }

      return {
        success: false,
        error: `Quest "${searchTerm}" not found`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find quest: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Read file content as string
   */
  readFile(filePath: string): FileOperationResult<string> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        success: true,
        data: content,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Write file content
   */
  writeFile(filePath: string, content: string): FileOperationResult<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Append content to file
   */
  appendFile(filePath: string, content: string): FileOperationResult<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });

      fs.appendFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to append to file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if file exists
   */
  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Check if directory exists
   */
  directoryExists(dirPath: string): boolean {
    try {
      return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * List files in directory
   */
  listFiles(dirPath: string): string[] {
    try {
      if (!this.directoryExists(dirPath)) {
        return [];
      }
      return fs.readdirSync(dirPath).filter((item) => {
        const fullPath = path.join(dirPath, item);
        return fs.statSync(fullPath).isFile();
      });
    } catch {
      return [];
    }
  }

  /**
   * Clean old quests
   */
  cleanOldQuests(basePath?: string): { completed: number; abandoned: number } {
    const structure = this.getFolderStructure(basePath);
    let completedCount = 0;
    let abandonedCount = 0;

    // Clean completed quests older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cleanState = (state: 'completed' | 'abandoned') => {
      const stateDir = structure[state];
      if (!this.directoryExists(stateDir)) return 0;

      let count = 0;
      const folders = fs.readdirSync(stateDir);

      for (const folder of folders) {
        const questPath = path.join(stateDir, folder, 'quest.json');
        if (this.fileExists(questPath)) {
          try {
            const questDataContent = fs.readFileSync(questPath, 'utf-8');
            const questData = JSON.parse(questDataContent) as {
              completedAt?: string;
              updatedAt?: string;
            };
            const questDate = new Date(questData.completedAt || questData.updatedAt || new Date());

            if (questDate < thirtyDaysAgo) {
              const folderPath = path.join(stateDir, folder);
              fs.rmSync(folderPath, { recursive: true });
              count++;
            }
          } catch {
            // Skip if can't parse
          }
        }
      }

      return count;
    };

    completedCount = cleanState('completed');
    abandonedCount = cleanState('abandoned');

    return { completed: completedCount, abandoned: abandonedCount };
  }

  /**
   * Find package.json files
   */
  findPackageJsons(basePath: string = process.cwd()): Array<{ dir: string; packageJson: unknown }> {
    const results: Array<{ dir: string; packageJson: unknown }> = [];

    const searchDir = (dir: string, depth: number = 0) => {
      if (depth > 5) return; // Max depth to prevent infinite recursion

      const packagePath = path.join(dir, 'package.json');
      if (this.fileExists(packagePath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
          results.push({ dir, packageJson });
        } catch {
          // Skip if can't parse
        }
      }

      // Search subdirectories
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          // Skip node_modules, hidden folders, and common build directories
          if (
            item === 'node_modules' ||
            item.startsWith('.') ||
            item === 'dist' ||
            item === 'build' ||
            item === 'out'
          ) {
            continue;
          }

          if (fs.statSync(fullPath).isDirectory()) {
            searchDir(fullPath, depth + 1);
          }
        }
      } catch {
        // Skip if can't read directory
      }
    };

    searchDir(basePath);
    return results;
  }
}
