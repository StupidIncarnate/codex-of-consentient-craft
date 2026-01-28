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
import * as pty from 'node-pty';

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
  runDungeonmasterInit(): Promise<void>;
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

  const runDungeonmasterInit = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const initProcess = pty.spawn('npx', ['dungeonmaster'], {
        name: 'xterm-color',
        cols: 120,
        rows: 30,
        cwd: projectPath,
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      let output = '';
      let menuFound = false;
      let initStarted = false;

      const timeout = setTimeout(() => {
        initProcess.kill();
        reject(new Error(`dungeonmaster init timed out. Output:\n${output}`));
      }, 60000); // 1 minute timeout

      initProcess.onData((data: string) => {
        output += data;

        // Wait for menu to appear, then navigate to Init option
        if (!menuFound && output.includes('Add - Add a new quest')) {
          menuFound = true;
          // Init is 4th option, press down 3 times then enter
          setTimeout(() => {
            initProcess.write('\x1b[B'); // down
            setTimeout(() => {
              initProcess.write('\x1b[B'); // down
              setTimeout(() => {
                initProcess.write('\x1b[B'); // down
                setTimeout(() => {
                  initProcess.write('\r'); // enter
                  initStarted = true;
                }, 100);
              }, 100);
            }, 100);
          }, 500);
        }

        // Check if init completed (shows success message)
        if (initStarted && output.includes('Installation complete!')) {
          clearTimeout(timeout);
          setTimeout(() => {
            initProcess.write('q'); // quit
          }, 500);
        }
      });

      initProcess.onExit(({ exitCode }) => {
        clearTimeout(timeout);
        // Exit code 0 or process killed after init is fine
        if (exitCode === 0 || initStarted) {
          resolve();
        } else {
          reject(new Error(`dungeonmaster init failed with code ${exitCode}. Output:\n${output}`));
        }
      });
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
