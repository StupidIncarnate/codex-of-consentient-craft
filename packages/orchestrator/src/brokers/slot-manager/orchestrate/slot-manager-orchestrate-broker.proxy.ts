import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { runOrchestrationLayerBrokerProxy } from './run-orchestration-layer-broker.proxy';

export const slotManagerOrchestrateBrokerProxy = (): {
  setupQuestLoad: (params: { questJson: string }) => void;
  setupQuestLoadError: (params: { error: Error }) => void;
  setupQuestUpdateRead: (params: { questJson: string }) => void;
  setupQuestUpdateWrite: () => void;
  getQuestWrittenContent: () => unknown;
  getQuestWrittenPath: () => unknown;
  setupPathseekerSpawn: (params: { exitCode: ExitCode }) => void;
  setupPathseekerSpawnWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupPathseekerCrash: (params: { exitCode: ExitCode }) => void;
  setupCodeweaverSpawn: (params: { exitCode: ExitCode }) => void;
  setupCodeweaverSpawnWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupCodeweaverTimeout: () => void;
  setupCodeweaverCrash: (params: { exitCode: ExitCode }) => void;
  setupSpiritmenderSpawn: (params: { exitCode: ExitCode }) => void;
  setupSpiritmenderSpawnWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupSpiritmenderError: (params: { error: Error }) => void;
  setupLawbringerSpawn: (params: { exitCode: ExitCode }) => void;
  setupLawbringerSpawnWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupSiegemasterSpawn: (params: { exitCode: ExitCode }) => void;
  setupSiegemasterSpawnWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupSignalQuestUpdate: (params: { questJson: string }) => void;
  getSignalWrittenQuestContent: () => unknown;
} => {
  const runOrchestrationProxy = runOrchestrationLayerBrokerProxy();

  return {
    setupQuestLoad: ({ questJson }: { questJson: string }): void => {
      runOrchestrationProxy.setupQuestLoad({ questJson });
    },
    setupQuestLoadError: ({ error }: { error: Error }): void => {
      runOrchestrationProxy.setupQuestLoadError({ error });
    },
    setupQuestUpdateRead: ({ questJson }: { questJson: string }): void => {
      runOrchestrationProxy.setupQuestUpdateRead({ questJson });
    },
    setupQuestUpdateWrite: (): void => {
      runOrchestrationProxy.setupQuestUpdateWrite();
    },
    getQuestWrittenContent: (): unknown => runOrchestrationProxy.getQuestWrittenContent(),
    getQuestWrittenPath: (): unknown => runOrchestrationProxy.getQuestWrittenPath(),
    setupPathseekerSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      runOrchestrationProxy.setupPathseekerSpawn({ exitCode });
    },
    setupPathseekerSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      runOrchestrationProxy.setupPathseekerSpawnWithSignal({ exitCode, lines });
    },
    setupPathseekerCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      runOrchestrationProxy.setupPathseekerCrash({ exitCode });
    },
    setupCodeweaverSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      runOrchestrationProxy.setupCodeweaverSpawn({ exitCode });
    },
    setupCodeweaverSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      runOrchestrationProxy.setupCodeweaverSpawnWithSignal({ exitCode, lines });
    },
    setupCodeweaverTimeout: (): void => {
      runOrchestrationProxy.setupCodeweaverTimeout();
    },
    setupCodeweaverCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      runOrchestrationProxy.setupCodeweaverCrash({ exitCode });
    },
    setupSpiritmenderSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      runOrchestrationProxy.setupSpiritmenderSpawn({ exitCode });
    },
    setupSpiritmenderSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      runOrchestrationProxy.setupSpiritmenderSpawnWithSignal({ exitCode, lines });
    },
    setupSpiritmenderError: ({ error }: { error: Error }): void => {
      runOrchestrationProxy.setupSpiritmenderError({ error });
    },
    setupLawbringerSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      runOrchestrationProxy.setupLawbringerSpawn({ exitCode });
    },
    setupLawbringerSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      runOrchestrationProxy.setupLawbringerSpawnWithSignal({ exitCode, lines });
    },
    setupSiegemasterSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      runOrchestrationProxy.setupSiegemasterSpawn({ exitCode });
    },
    setupSiegemasterSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      runOrchestrationProxy.setupSiegemasterSpawnWithSignal({ exitCode, lines });
    },
    setupSignalQuestUpdate: ({ questJson }: { questJson: string }): void => {
      runOrchestrationProxy.setupSignalQuestUpdate({ questJson });
    },
    getSignalWrittenQuestContent: (): unknown =>
      runOrchestrationProxy.getSignalWrittenQuestContent(),
  };
};
