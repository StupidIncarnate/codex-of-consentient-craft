/**
 * PURPOSE: Creates isolated test project directories for E2E tests
 *
 * USAGE:
 * const testbed = createE2ETestbed({ baseName: 'my-test' });
 * testbed.runDungeonmasterInit();
 * // ... run tests ...
 * testbed.cleanup();
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

const E2E_TEMP_BASE = '/tmp/dungeonmaster-e2e';
const QUESTS_FOLDER = '.dungeonmaster-quests';

export interface Quest {
  id: string;
  folder: string;
  title: string;
  status: string;
  createdAt: string;
  userRequest: string;
  contexts: unknown[];
  observables: unknown[];
  steps: unknown[];
  toolingRequirements: unknown[];
  executionLog: unknown[];
}

export interface E2ETestbed {
  projectPath: string;
  questExists(titlePattern: string): boolean;
  getQuestByFolder(folder: string): Quest | null;
  listQuestFolders(): string[];
  runDungeonmasterInit(): void;
  cleanup(): void;
}

export const createE2ETestbed = ({ baseName }: { baseName: string }): E2ETestbed => {
  const testId = crypto.randomBytes(4).toString('hex');
  const projectName = `${baseName}-${testId}`;
  const projectPath = path.join(E2E_TEMP_BASE, projectName);

  // Create project directory
  fs.mkdirSync(projectPath, { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
  };
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create .claude directory
  fs.mkdirSync(path.join(projectPath, '.claude'), { recursive: true });

  const questExists = (titlePattern: string): boolean => {
    const folders = listQuestFolders();
    for (const folder of folders) {
      const quest = getQuestByFolder(folder);
      if (quest !== null && quest.title.toLowerCase().includes(titlePattern.toLowerCase())) {
        return true;
      }
    }
    return false;
  };

  const getQuestByFolder = (folder: string): Quest | null => {
    const questPath = path.join(projectPath, QUESTS_FOLDER, folder, 'quest.json');
    if (!fs.existsSync(questPath)) {
      return null;
    }
    const content = fs.readFileSync(questPath, 'utf-8');
    return JSON.parse(content) as Quest;
  };

  const listQuestFolders = (): string[] => {
    const questsPath = path.join(projectPath, QUESTS_FOLDER);
    if (!fs.existsSync(questsPath)) {
      return [];
    }
    return fs.readdirSync(questsPath).filter((name) => {
      const stat = fs.statSync(path.join(questsPath, name));
      return stat.isDirectory();
    });
  };

  const runDungeonmasterInit = (): void => {
    execSync('npx dungeonmaster init', {
      cwd: projectPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  };

  const cleanup = (): void => {
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
  };

  return {
    projectPath,
    questExists,
    getQuestByFolder,
    listQuestFolders,
    runDungeonmasterInit,
    cleanup,
  };
};
