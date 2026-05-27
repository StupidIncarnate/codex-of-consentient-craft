import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { fsWatchFileAdapterProxy } from '../../../adapters/fs/watch-file/fs-watch-file-adapter.proxy';
import { orchestratorStartMonitorWatcherAdapterProxy } from '../../../adapters/orchestrator/start-monitor-watcher/orchestrator-start-monitor-watcher-adapter.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';

export const MonitorSessionWatchResponderProxy = (): {
  setupHomePath: () => void;
  enableDevLogs: () => void;
  setupFilePresent: (params: { contents: string }) => void;
  setupFileAbsent: () => void;
  triggerChangeWithContents: (params: { contents: string }) => void;
  triggerChangeWithAbsence: () => void;
  triggerWatcherError: (params: { error: Error }) => void;
  startMonitorWatcherResolves: () => void;
  startMonitorWatcherThrows: (params: { error: Error }) => void;
  wasStopCalled: () => boolean;
  getDevLogOutput: () => SpyOnHandle;
} => {
  const homePathProxy = dungeonmasterHomeFindBrokerProxy();
  const fsWatchProxy = fsWatchFileAdapterProxy();
  const orchAdapterProxy = orchestratorStartMonitorWatcherAdapterProxy();
  const devLogProxy = processDevLogAdapterProxy();

  return {
    setupHomePath: (): void => {
      homePathProxy.setupHomePath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      });
    },
    enableDevLogs: (): void => {
      devLogProxy.enableVerbose();
    },
    setupFilePresent: ({ contents }: { contents: string }): void => {
      fsWatchProxy.setupFilePresent({ contents });
    },
    setupFileAbsent: (): void => {
      fsWatchProxy.setupFileAbsent();
    },
    triggerChangeWithContents: ({ contents }: { contents: string }): void => {
      fsWatchProxy.triggerChangeWithContents({ contents });
    },
    triggerChangeWithAbsence: (): void => {
      fsWatchProxy.triggerChangeWithAbsence();
    },
    triggerWatcherError: ({ error }: { error: Error }): void => {
      fsWatchProxy.triggerWatcherError({ error });
    },
    startMonitorWatcherResolves: (): void => {
      orchAdapterProxy.resolves();
    },
    startMonitorWatcherThrows: ({ error }: { error: Error }): void => {
      orchAdapterProxy.throws({ error });
    },
    wasStopCalled: (): boolean => orchAdapterProxy.wasStopCalled(),
    getDevLogOutput: (): SpyOnHandle => devLogProxy.getWrittenLines(),
  };
};
