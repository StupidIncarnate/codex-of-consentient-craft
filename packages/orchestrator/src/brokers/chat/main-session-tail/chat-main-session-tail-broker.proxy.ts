import {
  claudeLineNormalizeBrokerProxy,
  osUserHomedirAdapterProxy,
} from '@dungeonmaster/shared/testing';

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
  const homedirProxy = osUserHomedirAdapterProxy();
  const tailProxy = fsWatchTailAdapterProxy();

  return {
    setupHomeDir: ({ homeDir }: { homeDir: string }): void => {
      homedirProxy.returns({ path: homeDir });
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
