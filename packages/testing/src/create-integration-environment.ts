import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

/**
 * Integration test environment utilities
 *
 * Creates temporary test projects in /tmp for integration testing.
 * Test environments are automatically cleaned up after each test via jest.setup.js.
 *
 * IMPORTANT: Files in /tmp are outside the TypeScript project, so:
 * - ✅ Works great for: CLI tools, file operations, command execution
 * - ✅ Works for: ESLint RuleTester (uses synthetic code, not real files)
 * - ❌ Won't work for: Running ESLint with type-aware rules on test files
 *   (type-aware rules need files in tsconfig.json include paths)
 */

// Import { jest } from '@jest/globals'; // Not needed in this version

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface PackageJson {
  [key: string]: unknown;
  name: string;
  version: string;
  devDependencies?: Record<string, string>;
  eslintConfig?: unknown;
  jest?: unknown;
  scripts: {
    [key: string]: string | undefined;
    test: string;
    lint?: string;
    typecheck: string;
  };
}

export interface QuestmaestroConfig {
  [key: string]: unknown;
  questFolder: string;
  wardCommands: Record<string, unknown>;
}

export interface TestProject {
  readonly projectPath: string;
  readonly projectName: string;
  readonly rootDir: string;

  installQuestmaestro: () => string;

  hasCommand: ({ command }: { command: string }) => boolean;

  fileExists: ({ fileName }: { fileName: string }) => boolean;

  readFile: ({ fileName }: { fileName: string }) => string;

  writeFile: ({ fileName, content }: { fileName: string; content: string }) => void;

  deleteFile: ({ fileName }: { fileName: string }) => void;

  getConfig: () => QuestmaestroConfig | null;

  getPackageJson: () => PackageJson;

  getQuestFiles: ({ subdir }: { subdir?: string }) => string[];

  executeCommand: ({ command }: { command: string }) => ExecResult;

  cleanup: () => void;
}

// Global tracking of created test environments for automatic cleanup
const createdEnvironments: TestProject[] = [];

const RANDOM_BYTES_LENGTH = 4;
const JSON_INDENT_SPACES = 2;

export const getCreatedEnvironments = (): readonly TestProject[] => createdEnvironments;

export const cleanupAllEnvironments = (): void => {
  for (const env of createdEnvironments) {
    env.cleanup();
  }
  createdEnvironments.length = 0;
};

export const createIntegrationEnvironment = ({
  baseName,
  options,
}: {
  baseName: string;
  options?: {
    createPackageJson?: boolean;
    setupEslint?: boolean; // Copy tsconfig/eslint from project for type-aware linting
  };
}): TestProject => {
  const testId = crypto.randomBytes(RANDOM_BYTES_LENGTH).toString('hex');
  const projectName = `${baseName}-${testId}`;
  // Use /tmp to keep test artifacts out of the repo
  // Most integration tests don't need ESLint to run on test files
  const baseDir = '/tmp';
  const projectPath = path.join(baseDir, projectName);

  // Create project directory
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }

  // Create basic package.json (optional)
  if (options?.createPackageJson !== false) {
    const packageJson: PackageJson = {
      name: projectName,
      version: '1.0.0',
      scripts: {
        test: 'echo "test placeholder"',
        lint: 'echo "lint placeholder"',
        typecheck: 'echo "typecheck placeholder"',
      },
    };

    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, JSON_INDENT_SPACES),
    );
  }

  // Setup ESLint support (optional) - creates tsconfig and eslint config
  // This allows ESLint with type-aware rules to work on files in /tmp
  if (options?.setupEslint === true) {
    // Create a minimal tsconfig.json that includes all files in this test env
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        moduleResolution: 'node',
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules'],
    };
    fs.writeFileSync(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, JSON_INDENT_SPACES),
    );

    // Always create a minimal eslint config that uses the local tsconfig
    // This allows type-aware ESLint rules to work on files in /tmp
    const minimalEslintConfig = `
// Auto-generated eslint config for integration test environment
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
];
`;
    fs.writeFileSync(path.join(projectPath, 'eslint.config.js'), minimalEslintConfig);
  }

  const testProject: TestProject = {
    projectPath,
    projectName,
    rootDir: projectPath,

    installQuestmaestro: (): string => {
      try {
        const result = execSync('npm run install-questmaestro', {
          cwd: projectPath,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        return result;
      } catch (error) {
        if (error instanceof Error && 'stdout' in error) {
          const execError = error as Error & { stdout?: Buffer | string };
          return execError.stdout?.toString() || error.message || 'Installation failed';
        }
        return error instanceof Error ? error.message : 'Installation failed';
      }
    },

    hasCommand: ({ command }: { command: string }): boolean => {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return false;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
      return Boolean(packageJson.scripts[command]);
    },

    fileExists: ({ fileName }: { fileName: string }): boolean =>
      fs.existsSync(path.join(projectPath, fileName)),

    readFile: ({ fileName }: { fileName: string }): string =>
      fs.readFileSync(path.join(projectPath, fileName), 'utf-8'),

    writeFile: ({ fileName, content }: { fileName: string; content: string }): void => {
      const filePath = path.join(projectPath, fileName);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);
    },

    deleteFile: ({ fileName }: { fileName: string }): void => {
      const filePath = path.join(projectPath, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    },

    getConfig: (): QuestmaestroConfig | null => {
      const configPath = path.join(projectPath, '.questmaestro');
      if (!fs.existsSync(configPath)) {
        return null;
      }
      return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as QuestmaestroConfig;
    },

    getPackageJson: (): PackageJson => {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      return JSON.parse(content) as PackageJson;
    },

    getQuestFiles: ({ subdir }: { subdir?: string }): string[] => {
      const questDir = subdir
        ? path.join(projectPath, 'questmaestro', subdir)
        : path.join(projectPath, 'questmaestro');

      if (!fs.existsSync(questDir)) {
        return [];
      }

      const extension = subdir ? '.json' : '.md';
      const basePath = subdir ? path.join('questmaestro', subdir) : 'questmaestro';

      return fs
        .readdirSync(questDir)
        .filter((file) => file.endsWith(extension))
        .map((file) => path.join(basePath, file));
    },

    executeCommand: ({ command }: { command: string }): ExecResult => {
      try {
        const result = execSync(command, {
          cwd: projectPath,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        return {
          stdout: result,
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

    cleanup: (): void => {
      if (fs.existsSync(projectPath)) {
        fs.rmSync(projectPath, { recursive: true, force: true });
      }
    },
  };

  // Track for automatic cleanup
  createdEnvironments.push(testProject);

  return testProject;
};
