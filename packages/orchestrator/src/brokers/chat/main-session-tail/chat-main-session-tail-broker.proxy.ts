import { homedir } from '#gateway/node/os';
import { tailFileProxy } from '#gateway/node/fs/tail-file/tail-file.proxy';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const chatMainSessionTailBrokerProxy = (): {
  setupHomeDir: (params: { homeDir: string }) => void;
  setupFile: (params: { path: string }) => void;
  setupLines: (params: { path: string; lines: readonly string[] }) => void;
  setupExistingFileWithContent: (params: { path: string }) => void;
  triggerChange: (params: { path: string }) => void;
  lastStartPositionWasFromFileEnd: (params: { path: string }) => boolean;
  getWatchCallsFor: (params: { path: string }) => readonly unknown[][];
} => {
  claudeLineNormalizeBrokerProxy();
  const homedirHandle = registerMock({ fn: homedir });
  const tailProxy = tailFileProxy();

  return {
    setupHomeDir: ({ homeDir }: { homeDir: string }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
    },
    setupFile: ({ path }: { path: string }): void => {
      tailProxy.setupFile({ path });
    },
    setupLines: ({ path, lines }: { path: string; lines: readonly string[] }): void => {
      tailProxy.setupLines({ path, lines });
    },
    setupExistingFileWithContent: ({ path }: { path: string }): void => {
      tailProxy.setupExistingFileWithContent({ path });
    },
    triggerChange: ({ path }: { path: string }): void => {
      tailProxy.triggerChange({ path });
    },
    lastStartPositionWasFromFileEnd: ({ path }: { path: string }): boolean =>
      tailProxy.lastStartPositionWasFromFileEnd({ path }),
    getWatchCallsFor: ({ path }: { path: string }): readonly unknown[][] =>
      tailProxy.getWatchCallsFor({ path }),
  };
};
