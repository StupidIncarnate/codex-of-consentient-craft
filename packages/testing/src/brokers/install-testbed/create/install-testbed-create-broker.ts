/**
 * PURPOSE: Creates and manages temporary test environments for integration testing the install system
 *
 * USAGE:
 * const testbed = installTestbedCreateBroker({ baseName: 'my-test' });
 * testbed.writeFile({ relativePath: '.claude/settings.json', content: '{}' });
 * const result = testbed.runInitCommand();
 * const settings = testbed.getClaudeSettings();
 * testbed.cleanup();
 * // Creates isolated test environment with pre-install requirements satisfied
 */

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import { cryptoRandomBytesAdapter } from '../../../adapters/crypto/random-bytes/crypto-random-bytes-adapter';
import { childProcessExecSyncAdapter } from '../../../adapters/child-process/exec-sync/child-process-exec-sync-adapter';
import { fileContentContract } from '../../../contracts/file-content/file-content-contract';
import { exitCodeContract } from '../../../contracts/exit-code/exit-code-contract';
import { processOutputContract } from '../../../contracts/process-output/process-output-contract';
import { installTestbedContract } from '../../../contracts/install-testbed/install-testbed-contract';
import { dungeonmasterConfigContract } from '../../../contracts/dungeonmaster-config/dungeonmaster-config-contract';
import { integrationEnvironmentStatics } from '../../../statics/integration-environment/integration-environment-statics';
import type { BaseName } from '../../../contracts/base-name/base-name-contract';
import type { RelativePath } from '../../../contracts/relative-path/relative-path-contract';
import type { FileContent } from '../../../contracts/file-content/file-content-contract';
import type { InstallTestbed } from '../../../contracts/install-testbed/install-testbed-contract';
import type { DungeonmasterConfig } from '../../../contracts/dungeonmaster-config/dungeonmaster-config-contract';

export const installTestbedCreateBroker = ({
  baseName,
}: {
  baseName: BaseName;
}): InstallTestbed => {
  const testId = cryptoRandomBytesAdapter({
    length: integrationEnvironmentStatics.constants.randomBytesLength,
  }).toString('hex');
  const projectName = `${baseName}-${testId}`;
  const { baseDir } = integrationEnvironmentStatics.paths;
  const projectPath = pathJoinAdapter({ paths: [baseDir, projectName] });

  // Create project directory
  if (!fsExistsAdapter({ filePath: projectPath })) {
    fsMkdirAdapter({ dirPath: projectPath, recursive: true });
  }

  // Create package.json to satisfy pre-install validation
  const packageJson = {
    name: projectName,
    version: integrationEnvironmentStatics.packageJson.version,
  };

  fsWriteFileAdapter({
    filePath: pathJoinAdapter({ paths: [projectPath, 'package.json'] }),
    content: fileContentContract.parse(
      JSON.stringify(packageJson, null, integrationEnvironmentStatics.constants.jsonIndentSpaces),
    ),
  });

  // Create .claude directory to satisfy pre-install validation
  const claudeDir = pathJoinAdapter({ paths: [projectPath, '.claude'] });
  if (!fsExistsAdapter({ filePath: claudeDir })) {
    fsMkdirAdapter({ dirPath: claudeDir, recursive: true });
  }

  // Get path to dungeonmaster repo root (6 levels up from create/ folder)
  const dungeonmasterPath = pathResolveAdapter({ paths: [__dirname, '../../../../../..'] });

  const testbed: InstallTestbed = {
    guildPath: installTestbedContract.shape.guildPath.parse(projectPath),
    dungeonmasterPath: installTestbedContract.shape.dungeonmasterPath.parse(dungeonmasterPath),

    cleanup: (): void => {
      if (fsExistsAdapter({ filePath: projectPath })) {
        fsRmAdapter({ filePath: projectPath, recursive: true, force: true });
      }
    },

    writeFile: ({
      relativePath,
      content,
    }: {
      relativePath: RelativePath;
      content: FileContent;
    }): void => {
      const fullPath = pathJoinAdapter({ paths: [projectPath, relativePath] });
      const dir = pathDirnameAdapter({ filePath: fullPath });
      if (!fsExistsAdapter({ filePath: dir })) {
        fsMkdirAdapter({ dirPath: dir, recursive: true });
      }
      fsWriteFileAdapter({ filePath: fullPath, content });
    },

    readFile: ({ relativePath }: { relativePath: RelativePath }): FileContent | null => {
      const fullPath = pathJoinAdapter({ paths: [projectPath, relativePath] });
      if (!fsExistsAdapter({ filePath: fullPath })) {
        return null;
      }
      const content = fsReadFileAdapter({ filePath: fullPath });
      return fileContentContract.parse(content);
    },

    getClaudeSettings: (): unknown => {
      const settingsPath = pathJoinAdapter({ paths: [projectPath, '.claude', 'settings.json'] });
      if (!fsExistsAdapter({ filePath: settingsPath })) {
        return null;
      }
      const content = fsReadFileAdapter({ filePath: settingsPath });
      return JSON.parse(content) as unknown;
    },

    getMcpConfig: (): unknown => {
      const mcpPath = pathJoinAdapter({ paths: [projectPath, '.mcp.json'] });
      if (!fsExistsAdapter({ filePath: mcpPath })) {
        return null;
      }
      const content = fsReadFileAdapter({ filePath: mcpPath });
      return JSON.parse(content) as unknown;
    },

    getDungeonmasterConfig: (): DungeonmasterConfig | null => {
      const configPath = pathJoinAdapter({ paths: [projectPath, '.dungeonmaster'] });
      if (!fsExistsAdapter({ filePath: configPath })) {
        return null;
      }
      const content = fsReadFileAdapter({ filePath: configPath });
      return dungeonmasterConfigContract.parse(JSON.parse(content));
    },

    getEslintConfig: (): FileContent | null => {
      const eslintPath = pathJoinAdapter({ paths: [projectPath, 'eslint.config.js'] });
      if (!fsExistsAdapter({ filePath: eslintPath })) {
        return null;
      }
      const content = fsReadFileAdapter({ filePath: eslintPath });
      return fileContentContract.parse(content);
    },

    runInitCommand: (): ReturnType<InstallTestbed['runInitCommand']> => {
      try {
        const result = childProcessExecSyncAdapter({
          command: 'dungeonmaster init',
          options: {
            cwd: projectPath,
            encoding: 'utf-8',
            stdio: 'pipe',
          },
        });
        const stdout = Buffer.isBuffer(result) ? result.toString('utf-8') : result;
        return {
          exitCode: exitCodeContract.parse(0),
          stdout: processOutputContract.parse(stdout),
          stderr: processOutputContract.parse(''),
        };
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
          return {
            exitCode: exitCodeContract.parse(exitCode),
            stdout: processOutputContract.parse(stdout),
            stderr: processOutputContract.parse(stderr),
          };
        }
        const stderr = error instanceof Error ? error.message : 'Unknown error';
        return {
          exitCode: exitCodeContract.parse(1),
          stdout: processOutputContract.parse(''),
          stderr: processOutputContract.parse(stderr),
        };
      }
    },
  };

  return testbed;
};
