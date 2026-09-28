import { homedir } from '#gateway/node/os';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';

export const chatMainSessionTailBrokerProxy = (): {
  setupHomeDir: (params: { homeDir: string }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  setupExistingFileWithContent: () => void;
  triggerChange: () => void;
  lastStartPositionWasFromFileEnd: () => boolean;
  lastWatchedPath: () => unknown;
} => {
  claudeLineNormalizeBrokerProxy();
  const homedirHandle = registerMock({ fn: homedir });
  const tailProxy = fsWatchTailAdapterProxy();

  return {
    setupHomeDir: ({ homeDir }: { homeDir: string }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      tailProxy.setupLines({ lines });
    },
    setupExistingFileWithContent: (): void => {
      tailProxy.setupExistingFileWithContent();
    },
    triggerChange: (): void => {
      tailProxy.triggerChange();
    },
    lastStartPositionWasFromFileEnd: (): boolean => tailProxy.lastStartPositionWasFromFileEnd(),
    lastWatchedPath: (): unknown => tailProxy.lastWatchedPath(),
  };
};
