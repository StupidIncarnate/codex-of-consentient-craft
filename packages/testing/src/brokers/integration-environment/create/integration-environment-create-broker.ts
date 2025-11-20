/**
 * PURPOSE: Creates and manages temporary test projects for integration testing
 *
 * USAGE:
 * const testProject = integrationEnvironmentCreateBroker({
 *   baseName: 'my-test',
 *   options: { createPackageJson: true, setupEslint: true }
 * });
 * testProject.writeFile({ fileName: 'src/index.ts', content: 'export const foo = 42;' });
 * const result = testProject.executeCommand({ command: 'npm test' });
 * testProject.cleanup();
 * // Creates isolated test environment in /tmp with automatic cleanup tracking
 *
 * IMPORTANT: Files in /tmp are outside the TypeScript project, so:
 * - ✅ Works great for: CLI tools, file operations, command execution
 * - ✅ Works for: ESLint RuleTester (uses synthetic code, not real files)
 * - ❌ Won't work for: Running ESLint with type-aware rules on test files
 *   (type-aware rules need files in tsconfig.json include paths)
 */

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { cryptoRandomBytesAdapter } from '../../../adapters/crypto/random-bytes/crypto-random-bytes-adapter';
import { childProcessExecSyncAdapter } from '../../../adapters/child-process/exec-sync/child-process-exec-sync-adapter';
import { fileContentContract } from '../../../contracts/file-content/file-content-contract';

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

export const integrationEnvironmentListBroker = (): readonly TestProject[] => createdEnvironments;

export const integrationEnvironmentCleanupAllBroker = (): void => {
  for (const env of createdEnvironments) {
    env.cleanup();
  }
  createdEnvironments.length = 0;
};

export const integrationEnvironmentCreateBroker = ({
  baseName,
  options,
}: {
  baseName: string;
  options?: {
    createPackageJson?: boolean;
    setupEslint?: boolean; // Copy tsconfig/eslint from project for type-aware linting
  };
}): TestProject => {
  const testId = cryptoRandomBytesAdapter({ length: RANDOM_BYTES_LENGTH }).toString('hex');
  const projectName = `${baseName}-${testId}`;
  // Use /tmp to keep test artifacts out of the repo
  // Most integration tests don't need ESLint to run on test files
  const baseDir = '/tmp';
  const projectPath = pathJoinAdapter({ paths: [baseDir, projectName] });

  // Create project directory
  if (!fsExistsAdapter({ filePath: projectPath })) {
    fsMkdirAdapter({ dirPath: projectPath, recursive: true });
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

    fsWriteFileAdapter({
      filePath: pathJoinAdapter({ paths: [projectPath, 'package.json'] }),
      content: fileContentContract.parse(JSON.stringify(packageJson, null, JSON_INDENT_SPACES)),
    });
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
    fsWriteFileAdapter({
      filePath: pathJoinAdapter({ paths: [projectPath, 'tsconfig.json'] }),
      content: fileContentContract.parse(JSON.stringify(tsconfig, null, JSON_INDENT_SPACES)),
    });

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
    fsWriteFileAdapter({
      filePath: pathJoinAdapter({ paths: [projectPath, 'eslint.config.js'] }),
      content: fileContentContract.parse(minimalEslintConfig),
    });
  }

  const testProject: TestProject = {
    projectPath,
    projectName,
    rootDir: projectPath,

    installQuestmaestro: (): string => {
      try {
        const result = childProcessExecSyncAdapter({
          command: 'npm run install-questmaestro',
          options: {
            cwd: projectPath,
            encoding: 'utf-8',
            stdio: 'pipe',
          },
        });
        return Buffer.isBuffer(result) ? result.toString('utf-8') : result;
      } catch (error) {
        if (error instanceof Error && 'stdout' in error) {
          const execError = error as Error & { stdout?: Buffer | string };
          return execError.stdout?.toString() || error.message || 'Installation failed';
        }
        return error instanceof Error ? error.message : 'Installation failed';
      }
    },

    hasCommand: ({ command }: { command: string }): boolean => {
      const packageJsonPath = pathJoinAdapter({ paths: [projectPath, 'package.json'] });
      if (!fsExistsAdapter({ filePath: packageJsonPath })) {
        return false;
      }

      const packageJson = JSON.parse(
        fsReadFileAdapter({ filePath: packageJsonPath }),
      ) as PackageJson;
      return Boolean(packageJson.scripts[command]);
    },

    fileExists: ({ fileName }: { fileName: string }): boolean =>
      fsExistsAdapter({ filePath: pathJoinAdapter({ paths: [projectPath, fileName] }) }),

    readFile: ({ fileName }: { fileName: string }): string =>
      fsReadFileAdapter({ filePath: pathJoinAdapter({ paths: [projectPath, fileName] }) }),

    writeFile: ({ fileName, content }: { fileName: string; content: string }): void => {
      const filePath = pathJoinAdapter({ paths: [projectPath, fileName] });
      const dir = pathDirnameAdapter({ filePath });
      if (!fsExistsAdapter({ filePath: dir })) {
        fsMkdirAdapter({ dirPath: dir, recursive: true });
      }
      fsWriteFileAdapter({ filePath, content: fileContentContract.parse(content) });
    },

    deleteFile: ({ fileName }: { fileName: string }): void => {
      const filePath = pathJoinAdapter({ paths: [projectPath, fileName] });
      if (fsExistsAdapter({ filePath })) {
        fsUnlinkAdapter({ filePath });
      }
    },

    getConfig: (): QuestmaestroConfig | null => {
      const configPath = pathJoinAdapter({ paths: [projectPath, '.questmaestro'] });
      if (!fsExistsAdapter({ filePath: configPath })) {
        return null;
      }
      return JSON.parse(fsReadFileAdapter({ filePath: configPath })) as QuestmaestroConfig;
    },

    getPackageJson: (): PackageJson => {
      const packageJsonPath = pathJoinAdapter({ paths: [projectPath, 'package.json'] });
      const content = fsReadFileAdapter({ filePath: packageJsonPath });
      return JSON.parse(content) as PackageJson;
    },

    getQuestFiles: ({ subdir }: { subdir?: string }): string[] => {
      const questDir = subdir
        ? pathJoinAdapter({ paths: [projectPath, 'questmaestro', subdir] })
        : pathJoinAdapter({ paths: [projectPath, 'questmaestro'] });

      if (!fsExistsAdapter({ filePath: questDir })) {
        return [];
      }

      const extension = subdir ? '.json' : '.md';
      const basePath = subdir
        ? pathJoinAdapter({ paths: ['questmaestro', subdir] })
        : 'questmaestro';

      return fsReaddirAdapter({ dirPath: questDir })
        .filter((file) => file.endsWith(extension))
        .map((file) => pathJoinAdapter({ paths: [basePath, file] }));
    },

    executeCommand: ({ command }: { command: string }): ExecResult => {
      try {
        const result = childProcessExecSyncAdapter({
          command,
          options: {
            cwd: projectPath,
            encoding: 'utf-8',
            stdio: 'pipe',
          },
        });
        return {
          stdout: Buffer.isBuffer(result) ? result.toString('utf-8') : result,
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
      if (fsExistsAdapter({ filePath: projectPath })) {
        fsRmAdapter({ filePath: projectPath, recursive: true, force: true });
      }
    },
  };

  // Track for automatic cleanup
  createdEnvironments.push(testProject);

  return testProject;
};
