import { existsSync, readJsonFileSyncIfExists } from '@dungeonmaster/node/fs';
import { resolvePackageRoot } from '@dungeonmaster/node/module';
import path from '@dungeonmaster/node/path';
import { getEnv } from '@dungeonmaster/node/process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const resolveClaudeCliPathProxy = (): {
  setupOverride: (params: { cliPath: string }) => void;
  setupNoOverride: () => void;
  setupNpmPackage: (params: { packageRoot: string; bin: unknown }) => void;
  setupNoNpmPackage: () => void;
  setupPackageJsonMissing: (params: { packageRoot: string }) => void;
  setupPathScan: (params: { directories: string[]; foundInDirectory?: string }) => void;
} => {
  const envHandle = registerMock({ fn: getEnv });
  const resolvePackageRootHandle = registerMock({ fn: resolvePackageRoot });
  const readJsonHandle = registerMock({ fn: readJsonFileSyncIfExists });
  const existsHandle = registerMock({ fn: existsSync });

  return {
    setupOverride: ({ cliPath }: { cliPath: string }): void => {
      envHandle.calledWith(['CLAUDE_CLI_PATH']).returns(cliPath);
    },

    setupNoOverride: (): void => {
      envHandle.calledWith(['CLAUDE_CLI_PATH']).returns(undefined);
    },

    setupNpmPackage: ({ packageRoot, bin }: { packageRoot: string; bin: unknown }): void => {
      resolvePackageRootHandle
        .calledWith([{ specifier: '@anthropic-ai/claude-code' }])
        .returns(packageRoot);
      readJsonHandle.calledWith([path.join(packageRoot, 'package.json')]).returns({ bin });
    },

    setupNoNpmPackage: (): void => {
      resolvePackageRootHandle
        .calledWith([{ specifier: '@anthropic-ai/claude-code' }])
        .returns(null);
    },

    setupPackageJsonMissing: ({ packageRoot }: { packageRoot: string }): void => {
      resolvePackageRootHandle
        .calledWith([{ specifier: '@anthropic-ai/claude-code' }])
        .returns(packageRoot);
      readJsonHandle.calledWith([path.join(packageRoot, 'package.json')]).returns(null);
    },

    setupPathScan: ({
      directories,
      foundInDirectory,
    }: {
      directories: string[];
      foundInDirectory?: string;
    }): void => {
      envHandle.calledWith(['PATH']).returns(directories.join(path.delimiter));
      directories.forEach((directory) => {
        existsHandle
          .calledWith([path.join(directory, 'claude')])
          .returns(directory === foundInDirectory);
      });
    },
  };
};
