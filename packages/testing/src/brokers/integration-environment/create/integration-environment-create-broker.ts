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
import { processOutputContract } from '../../../contracts/process-output/process-output-contract';
import { fileNameContract } from '../../../contracts/file-name/file-name-contract';
import { execResultContract } from '../../../contracts/exec-result/exec-result-contract';
import { testProjectContract } from '../../../contracts/test-project/test-project-contract';
import { integrationEnvironmentTrackingBroker } from '../tracking/integration-environment-tracking-broker';
import { integrationEnvironmentStatics } from '../../../statics/integration-environment/integration-environment-statics';
import type { ProcessOutput } from '../../../contracts/process-output/process-output-contract';
import type { FileName } from '../../../contracts/file-name/file-name-contract';
import type { FileContent } from '../../../contracts/file-content/file-content-contract';
import type { CommandName } from '../../../contracts/command-name/command-name-contract';
import type { ExecResult } from '../../../contracts/exec-result/exec-result-contract';
import type { PackageJson } from '../../../contracts/package-json/package-json-contract';
import type { QuestmaestroConfig } from '../../../contracts/questmaestro-config/questmaestro-config-contract';
import type { TestProject } from '../../../contracts/test-project/test-project-contract';
import type { BaseName } from '../../../contracts/base-name/base-name-contract';

export const integrationEnvironmentCreateBroker = ({
  baseName,
  options,
}: {
  baseName: BaseName;
  options?: {
    createPackageJson?: boolean;
    setupEslint?: boolean; // Copy tsconfig/eslint from project for type-aware linting
  };
}): TestProject => {
  const testId = cryptoRandomBytesAdapter({
    length: integrationEnvironmentStatics.constants.randomBytesLength,
  }).toString('hex');
  const projectName = `${baseName}-${testId}`;
  // Use /tmp to keep test artifacts out of the repo
  // Most integration tests don't need ESLint to run on test files
  const { baseDir } = integrationEnvironmentStatics.paths;
  const projectPath = pathJoinAdapter({ paths: [baseDir, projectName] });

  // Create project directory
  if (!fsExistsAdapter({ filePath: projectPath })) {
    fsMkdirAdapter({ dirPath: projectPath, recursive: true });
  }

  // Create basic package.json (optional)
  if (options?.createPackageJson !== false) {
    const packageJson = {
      name: projectName,
      version: integrationEnvironmentStatics.packageJson.version,
      scripts: integrationEnvironmentStatics.packageJson.scripts,
    };

    fsWriteFileAdapter({
      filePath: pathJoinAdapter({ paths: [projectPath, 'package.json'] }),
      content: fileContentContract.parse(
        JSON.stringify(packageJson, null, integrationEnvironmentStatics.constants.jsonIndentSpaces),
      ),
    });
  }

  // Setup ESLint support (optional) - creates tsconfig and eslint config
  // This allows ESLint with type-aware rules to work on files in /tmp
  if (options?.setupEslint === true) {
    // Create a minimal tsconfig.json that includes all files in this test env
    const { tsconfig } = integrationEnvironmentStatics;
    fsWriteFileAdapter({
      filePath: pathJoinAdapter({ paths: [projectPath, 'tsconfig.json'] }),
      content: fileContentContract.parse(
        JSON.stringify(tsconfig, null, integrationEnvironmentStatics.constants.jsonIndentSpaces),
      ),
    });

    // Always create a minimal eslint config that uses the local tsconfig
    // This allows type-aware ESLint rules to work on files in /tmp
    fsWriteFileAdapter({
      filePath: pathJoinAdapter({ paths: [projectPath, 'eslint.config.js'] }),
      content: fileContentContract.parse(integrationEnvironmentStatics.eslintConfig.template),
    });
  }

  const testProject: TestProject = {
    projectPath: testProjectContract.shape.projectPath.parse(projectPath),
    projectName: testProjectContract.shape.projectName.parse(projectName),
    rootDir: testProjectContract.shape.rootDir.parse(projectPath),

    installQuestmaestro: (): ProcessOutput => {
      try {
        const result = childProcessExecSyncAdapter({
          command: 'npm run install-questmaestro',
          options: {
            cwd: projectPath,
            encoding: 'utf-8',
            stdio: 'pipe',
          },
        });
        const output = Buffer.isBuffer(result) ? result.toString('utf-8') : result;
        return processOutputContract.parse(output);
      } catch (error) {
        if (error instanceof Error && 'stdout' in error) {
          const execError = error as Error & { stdout?: unknown };
          const output = execError.stdout?.toString() || error.message || 'Installation failed';
          return processOutputContract.parse(output);
        }
        const output = error instanceof Error ? error.message : 'Installation failed';
        return processOutputContract.parse(output);
      }
    },

    hasCommand: ({ command }: { command: CommandName }): boolean => {
      const packageJsonPath = pathJoinAdapter({ paths: [projectPath, 'package.json'] });
      if (!fsExistsAdapter({ filePath: packageJsonPath })) {
        return false;
      }

      const packageJson = JSON.parse(
        fsReadFileAdapter({ filePath: packageJsonPath }),
      ) as PackageJson;
      return Boolean(packageJson.scripts[command]);
    },

    fileExists: ({ fileName }: { fileName: FileName }): boolean =>
      fsExistsAdapter({ filePath: pathJoinAdapter({ paths: [projectPath, fileName] }) }),

    readFile: ({ fileName }: { fileName: FileName }): FileContent => {
      const content = fsReadFileAdapter({
        filePath: pathJoinAdapter({ paths: [projectPath, fileName] }),
      });
      return fileContentContract.parse(content);
    },

    writeFile: ({ fileName, content }: { fileName: FileName; content: FileContent }): void => {
      const filePath = pathJoinAdapter({ paths: [projectPath, fileName] });
      const dir = pathDirnameAdapter({ filePath });
      if (!fsExistsAdapter({ filePath: dir })) {
        fsMkdirAdapter({ dirPath: dir, recursive: true });
      }
      fsWriteFileAdapter({ filePath, content });
    },

    deleteFile: ({ fileName }: { fileName: FileName }): void => {
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

    getQuestFiles: ({ subdir }: { subdir?: FileName }): FileName[] => {
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
        .map((file) => fileNameContract.parse(pathJoinAdapter({ paths: [basePath, file] })));
    },

    executeCommand: ({ command }: { command: CommandName }): ExecResult => {
      try {
        const result = childProcessExecSyncAdapter({
          command,
          options: {
            cwd: projectPath,
            encoding: 'utf-8',
            stdio: 'pipe',
          },
        });
        const stdout = Buffer.isBuffer(result) ? result.toString('utf-8') : result;
        return execResultContract.parse({
          stdout,
          stderr: '',
          exitCode: 0,
        });
      } catch (error) {
        if (error instanceof Error && 'stdout' in error && 'stderr' in error && 'status' in error) {
          const execError = error as Error & {
            stdout?: unknown;
            stderr?: unknown;
            status?: unknown;
          };
          const stdout = execError.stdout?.toString() || '';
          const stderr = execError.stderr?.toString() || error.message || '';
          const exitCode = typeof execError.status === 'number' ? execError.status : 1;
          return execResultContract.parse({
            stdout,
            stderr,
            exitCode,
          });
        }
        const stderr = error instanceof Error ? error.message : 'Unknown error';
        return execResultContract.parse({
          stdout: '',
          stderr,
          exitCode: 1,
        });
      }
    },

    cleanup: (): void => {
      if (fsExistsAdapter({ filePath: projectPath })) {
        fsRmAdapter({ filePath: projectPath, recursive: true, force: true });
      }
    },
  };

  // Track for automatic cleanup
  integrationEnvironmentTrackingBroker.add({ project: testProject });

  return testProject;
};
