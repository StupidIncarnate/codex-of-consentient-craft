import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';
import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

const DEFAULT_TEST_HOMEDIR = '/home/test-user';

export const limitsReadBrokerProxy = (): {
  setupHomeDir: (params: { homeDir: string }) => void;
  setupMissingConfig: (params?: { homeDir?: string }) => void;
  setupValidConfig: (params?: {
    homeDir?: string;
    resources?: unknown;
    guilds?: readonly unknown[];
  }) => void;
  setupInvalidResources: (params?: { homeDir?: string; resources?: unknown }) => void;
  setupUnparseableConfig: (params?: { homeDir?: string }) => void;
  setupRawPath: (params: { path: string; rawContents: string }) => void;
  getCallsFor: (params: { path: string }) => readonly unknown[][];
} => {
  const readJsonProxy = readJsonFileIfExistsProxy();
  const homedirHandle = registerMock({ fn: homedir });

  const state = {
    currentHomeDir: DEFAULT_TEST_HOMEDIR,
  };
  homedirHandle.calledWith([]).implement(() => state.currentHomeDir);

  const resolveConfigPath = (homeDir?: string): string => {
    const effectiveHome = homeDir ?? state.currentHomeDir;
    return join(
      effectiveHome,
      dungeonmasterHomeStatics.paths.configDir,
      dungeonmasterHomeStatics.paths.configFile,
    );
  };

  return {
    setupHomeDir: ({ homeDir }: { homeDir: string }): void => {
      state.currentHomeDir = homeDir;
      homedirHandle.calledWith([]).returns(homeDir);
    },
    setupMissingConfig: ({ homeDir }: { homeDir?: string } = {}): void => {
      const path = resolveConfigPath(homeDir);
      if (homeDir !== undefined) {
        state.currentHomeDir = homeDir;
        homedirHandle.calledWith([]).returns(homeDir);
      }
      readJsonProxy.missing({ path });
    },
    setupValidConfig: ({
      homeDir,
      resources,
      guilds,
    }: {
      homeDir?: string;
      resources?: unknown;
      guilds?: readonly unknown[];
    } = {}): void => {
      const path = resolveConfigPath(homeDir);
      if (homeDir !== undefined) {
        state.currentHomeDir = homeDir;
        homedirHandle.calledWith([]).returns(homeDir);
      }
      const config: Record<string, unknown> = {};
      if (resources !== undefined) {
        config.resources = resources;
      }
      if (guilds !== undefined) {
        config.guilds = guilds;
      }
      readJsonProxy.returnsRaw({ path, rawContents: JSON.stringify(config) });
    },
    setupInvalidResources: ({
      homeDir,
      resources = { maxMemoryPercent: 150 },
    }: {
      homeDir?: string;
      resources?: unknown;
    } = {}): void => {
      const path = resolveConfigPath(homeDir);
      if (homeDir !== undefined) {
        state.currentHomeDir = homeDir;
        homedirHandle.calledWith([]).returns(homeDir);
      }
      readJsonProxy.returnsRaw({
        path,
        rawContents: JSON.stringify({ resources }),
      });
    },
    setupUnparseableConfig: ({ homeDir }: { homeDir?: string } = {}): void => {
      const path = resolveConfigPath(homeDir);
      if (homeDir !== undefined) {
        state.currentHomeDir = homeDir;
        homedirHandle.calledWith([]).returns(homeDir);
      }
      readJsonProxy.returnsRaw({ path, rawContents: '{ invalid json' });
    },
    setupRawPath: ({ path, rawContents }: { path: string; rawContents: string }): void => {
      readJsonProxy.returnsRaw({ path, rawContents });
    },
    getCallsFor: ({ path }: { path: string }): readonly unknown[][] =>
      readJsonProxy.getCallsFor({ path }),
  };
};
