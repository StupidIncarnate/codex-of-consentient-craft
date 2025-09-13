import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

// import { jest } from '@jest/globals'; // Not needed in this version

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
    lint?: string;
    typecheck: string;
    [key: string]: string | undefined;
  };
  eslintConfig?: unknown;
  jest?: unknown;
  devDependencies?: {
    [key: string]: string;
  };
}

export interface QuestmaestroConfig {
  questFolder: string;
  wardCommands: {
    [key: string]: unknown;
  };

  [key: string]: unknown;
}

export interface TestProject {
  readonly projectPath: string;
  readonly projectName: string;
  readonly rootDir: string;

  installQuestmaestro(): string;

  hasCommand(command: string): boolean;

  fileExists(fileName: string): boolean;

  readFile(fileName: string): string;

  writeFile(fileName: string, content: string): void;

  deleteFile(fileName: string): void;

  getConfig(): QuestmaestroConfig | null;

  getPackageJson(): PackageJson;

  getQuestFiles(subdir?: string): string[];

  executeCommand(command: string): ExecResult;

  cleanup(): void;
}

export function createTestProject(baseName: string): TestProject {
  const testId = crypto.randomBytes(4).toString('hex');
  const projectName = `${baseName}-${testId}`;
  const projectPath = path.resolve(process.cwd(), 'tests', 'tmp', projectName);

  // Create project directory
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }

  // Create basic package.json
  const packageJson: PackageJson = {
    name: projectName,
    version: '1.0.0',
    scripts: {
      test: 'echo "test placeholder"',
      lint: 'echo "lint placeholder"',
      typecheck: 'echo "typecheck placeholder"',
    },
  };

  fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));

  const testProject: TestProject = {
    projectPath,
    projectName,
    rootDir: projectPath,

    installQuestmaestro(): string {
      try {
        const result = execSync('npm run install-questmaestro', {
          cwd: projectPath,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        return result.toString();
      } catch (error) {
        if (error instanceof Error && 'stdout' in error) {
          const execError = error as Error & { stdout?: Buffer | string };
          return execError.stdout?.toString() || error.message || 'Installation failed';
        }
        return error instanceof Error ? error.message : 'Installation failed';
      }
    },

    hasCommand(command: string): boolean {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) return false;

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
      return !!(packageJson.scripts && packageJson.scripts[command]);
    },

    fileExists(fileName: string): boolean {
      return fs.existsSync(path.join(projectPath, fileName));
    },

    readFile(fileName: string): string {
      return fs.readFileSync(path.join(projectPath, fileName), 'utf-8');
    },

    writeFile(fileName: string, content: string): void {
      const filePath = path.join(projectPath, fileName);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);
    },

    deleteFile(fileName: string): void {
      const filePath = path.join(projectPath, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    },

    getConfig(): QuestmaestroConfig | null {
      const configPath = path.join(projectPath, '.questmaestro');
      if (!fs.existsSync(configPath)) return null;
      return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as QuestmaestroConfig;
    },

    getPackageJson(): PackageJson {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      return JSON.parse(content) as PackageJson;
    },

    getQuestFiles(subdir?: string): string[] {
      const questDir = subdir
        ? path.join(projectPath, 'questmaestro', subdir)
        : path.join(projectPath, 'questmaestro');

      if (!fs.existsSync(questDir)) return [];

      const extension = subdir ? '.json' : '.md';
      const basePath = subdir ? path.join('questmaestro', subdir) : 'questmaestro';

      return fs
        .readdirSync(questDir)
        .filter((file) => file.endsWith(extension))
        .map((file) => path.join(basePath, file));
    },

    executeCommand(command: string): ExecResult {
      try {
        const result = execSync(command, {
          cwd: projectPath,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        return {
          stdout: result.toString(),
          stderr: '',
          exitCode: 0,
        };
      } catch (error) {
        if (error instanceof Error && 'stdout' in error && 'stderr' in error && 'status' in error) {
          const execError = error as Error & {
            stdout?: Buffer | string;
            stderr?: Buffer | string;
            status?: number;
          };
          return {
            stdout: execError.stdout?.toString() || '',
            stderr: execError.stderr?.toString() || error.message || '',
            exitCode: execError.status || 1,
          };
        }
        return {
          stdout: '',
          stderr: error instanceof Error ? error.message : 'Unknown error',
          exitCode: 1,
        };
      }
    },

    cleanup(): void {
      if (fs.existsSync(projectPath)) {
        fs.rmSync(projectPath, { recursive: true, force: true });
      }
    },
  };

  return testProject;
}
