import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
import { jest } from '@jest/globals';
import { main as installMain } from '../../bin/install';
import { DungeonmasterConfig, Quest } from '../../v1/types';

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface PackageJson {
  name: string;
  version: string;
  scripts: {
    test: string;
    lint: string;
    typecheck: string;
    [key: string]: string;
  };
  eslintConfig?: unknown;
  jest?: unknown;
  devDependencies?: {
    [key: string]: string;
  };
}

export class TestProject {
  public name: string;
  public id: string;
  public rootDir: string;

  constructor(name: string) {
    this.name = name;
    this.id = crypto.randomBytes(4).toString('hex');
    this.rootDir = path.join(process.cwd(), 'tests', 'tmp', `${name}-${this.id}`);
  }

  setup() {
    // Create project directory
    fs.mkdirSync(this.rootDir, { recursive: true });

    // Create .claude directory structure
    const claudeDir = path.join(this.rootDir, '.claude');
    const commandsDir = path.join(claudeDir, 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });

    // Create a basic package.json with required configs
    const packageJson: PackageJson = {
      name: `test-project-${this.name}`,
      version: '1.0.0',
      scripts: {
        test: 'jest',
        lint: 'eslint .',
        typecheck: 'echo "Type checking"',
      },
      eslintConfig: {
        env: {
          node: true,
          es2021: true,
        },
      },
      jest: {
        testEnvironment: 'node',
      },
    };

    fs.writeFileSync(path.join(this.rootDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    return this;
  }

  installDungeonmaster() {
    // Mock process.exit to prevent test from exiting
    const mockExit = jest
      .spyOn(process, 'exit')
      .mockImplementation((code?: string | number | null) => {
        if (code && code !== 0) {
          throw new Error(`Process exit with code ${code}`);
        }
        return undefined as never;
      });

    // Capture console output
    const consoleOutput: string[] = [];
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation((...args) => {
      consoleOutput.push(args.join(' '));
    });

    // Change to test project directory
    const originalCwd = process.cwd();
    process.chdir(this.rootDir);

    try {
      // Run the installer directly
      installMain();
    } catch (error: unknown) {
      // If it's a process.exit error with code 1, re-throw it
      if (
        error instanceof Error &&
        error.message &&
        error.message.includes('Process exit with code')
      ) {
        throw error;
      }
    } finally {
      // Restore original directory and mocks
      process.chdir(originalCwd);
      mockExit.mockRestore();
      mockConsoleLog.mockRestore();
    }

    return consoleOutput.join('\n');
  }

  // Check if a file exists relative to the test project root
  fileExists(relativePath: string) {
    return fs.existsSync(path.join(this.rootDir, relativePath));
  }

  // Read a file from the test project
  readFile(relativePath: string) {
    return fs.readFileSync(path.join(this.rootDir, relativePath), 'utf8');
  }

  // Write a file to the test project
  writeFile(relativePath: string, content: string) {
    const fullPath = path.join(this.rootDir, relativePath);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
  }

  // Execute a command in the test project directory
  exec(command: string) {
    try {
      const result = execSync(command, {
        cwd: this.rootDir,
        encoding: 'utf8',
      });
      return { stdout: result, stderr: '', exitCode: 0 } as ExecResult;
    } catch (error) {
      // execSync throws an Error with additional properties when command fails
      if (error instanceof Error) {
        const execError = error as Error & {
          stdout?: Buffer | string;
          stderr?: Buffer | string;
          status?: number;
        };
        return {
          stdout: execError.stdout ? String(execError.stdout) : '',
          stderr: execError.stderr ? String(execError.stderr) : execError.message,
          exitCode: execError.status ?? 1,
        };
      }
      return {
        stdout: '',
        stderr: String(error),
        exitCode: 1,
      };
    }
  }

  // Check if a quest command exists
  hasCommand(commandName: string) {
    // Handle both regular commands and quest: commands
    if (commandName.startsWith('quest:')) {
      const agentName = commandName.replace('quest:', '');
      const commandPath = path.join(
        this.rootDir,
        '.claude',
        'commands',
        'quest',
        `${agentName}.md`,
      );
      return fs.existsSync(commandPath);
    } else {
      const commandPath = path.join(this.rootDir, '.claude', 'commands', `${commandName}.md`);
      return fs.existsSync(commandPath);
    }
  }

  // Get list of quest files in a folder
  getQuestFiles(folder: 'active' | 'completed' | 'abandoned') {
    const folderPath = path.join(this.rootDir, 'dungeonmaster', folder);
    if (fs.existsSync(folderPath)) {
      return fs
        .readdirSync(folderPath)
        .filter((file) => file.endsWith('.json'))
        .sort(); // Alphabetical order
    }
    return [];
  }

  // Get a specific quest file
  getQuest(questId: string, folder: 'active' | 'completed' | 'abandoned' = 'active'): Quest | null {
    const questPath = path.join(this.rootDir, 'dungeonmaster', folder, `${questId}.json`);
    if (fs.existsSync(questPath)) {
      return JSON.parse(fs.readFileSync(questPath, 'utf8')) as Quest;
    }
    return null;
  }

  // Get configuration
  getConfig() {
    const configPath = path.join(this.rootDir, '.dungeonmaster');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8')) as DungeonmasterConfig;
    }
    return null;
  }

  // Get package.json
  getPackageJson() {
    const packagePath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;
    }
    return null;
  }

  // Delete a file
  deleteFile(relativePath: string) {
    const fullPath = path.join(this.rootDir, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  // Clean up the test project
  cleanup() {
    if (fs.existsSync(this.rootDir)) {
      fs.rmSync(this.rootDir, { recursive: true, force: true });
    }
  }
}

// Factory function to create and setup a test project
export function createTestProject(name: string = 'test') {
  const project = new TestProject(name);
  project.setup();
  return project;
}
