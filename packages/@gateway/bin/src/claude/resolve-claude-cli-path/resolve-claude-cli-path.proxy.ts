import { existsSync, readJsonFileSyncIfExists } from '#gateway/node/fs';
import { resolvePackageRoot } from '#gateway/node/module';
import path from '#gateway/node/path';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// The fs and module mocks are registered by the scenarios that need them, not at construction: a
// composing proxy (spawnStreamJsonProxy) builds this one only for `setupOverride`, and a
// constructor-level mock of `existsSync` would refuse every unrelated existence check the
// composer's own tests make.
export const resolveClaudeCliPathProxy = (): {
  setupOverride: (params: { cliPath: string }) => void;
  setupNoOverride: () => void;
  setupNpmPackage: (params: { packageRoot: string; bin: unknown }) => void;
  setupNoNpmPackage: () => void;
  setupPackageJsonMissing: (params: { packageRoot: string }) => void;
  setupPathScan: (params: { directories: string[]; foundInDirectory?: string }) => void;
} => {
  const envProxy = getEnvProxy();

  return {
    setupOverride: ({ cliPath }: { cliPath: string }): void => {
      envProxy.setupEnv({ name: 'CLAUDE_CLI_PATH', value: cliPath });
    },

    setupNoOverride: (): void => {
      envProxy.setupEnv({ name: 'CLAUDE_CLI_PATH', value: undefined });
    },

    setupNpmPackage: ({ packageRoot, bin }: { packageRoot: string; bin: unknown }): void => {
      registerMock({ fn: resolvePackageRoot })
        .calledWith([{ specifier: '@anthropic-ai/claude-code' }])
        .returns(packageRoot);
      registerMock({ fn: readJsonFileSyncIfExists })
        .calledWith([path.join(packageRoot, 'package.json')])
        .returns({ bin });
    },

    setupNoNpmPackage: (): void => {
      registerMock({ fn: resolvePackageRoot })
        .calledWith([{ specifier: '@anthropic-ai/claude-code' }])
        .returns(null);
    },

    setupPackageJsonMissing: ({ packageRoot }: { packageRoot: string }): void => {
      registerMock({ fn: resolvePackageRoot })
        .calledWith([{ specifier: '@anthropic-ai/claude-code' }])
        .returns(packageRoot);
      registerMock({ fn: readJsonFileSyncIfExists })
        .calledWith([path.join(packageRoot, 'package.json')])
        .returns(null);
    },

    setupPathScan: ({
      directories,
      foundInDirectory,
    }: {
      directories: string[];
      foundInDirectory?: string;
    }): void => {
      envProxy.setupEnv({ name: 'PATH', value: directories.join(path.delimiter) });
      const existsHandle = registerMock({ fn: existsSync });
      directories.forEach((directory) => {
        existsHandle
          .calledWith([path.join(directory, 'claude')])
          .returns(directory === foundInDirectory);
      });
    },
  };
};
