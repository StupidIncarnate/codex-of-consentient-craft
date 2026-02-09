import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { orchestrationLoopLayerBrokerProxy } from './orchestration-loop-layer-broker.proxy';

export const runOrchestrationLayerBrokerProxy = (): {
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
  const loopProxy = orchestrationLoopLayerBrokerProxy();

  return {
    setupQuestLoad: ({ questJson }: { questJson: string }): void => {
      loopProxy.setupQuestLoad({ questJson });
    },
    setupQuestLoadError: ({ error }: { error: Error }): void => {
      loopProxy.setupQuestLoadError({ error });
    },
    setupQuestUpdateRead: ({ questJson }: { questJson: string }): void => {
      loopProxy.setupQuestUpdateRead({ questJson });
    },
    setupQuestUpdateWrite: (): void => {
      loopProxy.setupQuestUpdateWrite();
    },
    getQuestWrittenContent: (): unknown => loopProxy.getQuestWrittenContent(),
    getQuestWrittenPath: (): unknown => loopProxy.getQuestWrittenPath(),
    setupPathseekerSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      loopProxy.setupPathseekerSpawn({ exitCode });
    },
    setupPathseekerSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      loopProxy.setupPathseekerSpawnWithSignal({ exitCode, lines });
    },
    setupPathseekerCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      loopProxy.setupPathseekerCrash({ exitCode });
    },
    setupCodeweaverSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      loopProxy.setupCodeweaverSpawn({ exitCode });
    },
    setupCodeweaverSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      loopProxy.setupCodeweaverSpawnWithSignal({ exitCode, lines });
    },
    setupCodeweaverTimeout: (): void => {
      loopProxy.setupCodeweaverTimeout();
    },
    setupCodeweaverCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      loopProxy.setupCodeweaverCrash({ exitCode });
    },
    setupSpiritmenderSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      loopProxy.setupSpiritmenderSpawn({ exitCode });
    },
    setupSpiritmenderSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      loopProxy.setupSpiritmenderSpawnWithSignal({ exitCode, lines });
    },
    setupSpiritmenderError: ({ error }: { error: Error }): void => {
      loopProxy.setupSpiritmenderError({ error });
    },
    setupLawbringerSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      loopProxy.setupLawbringerSpawn({ exitCode });
    },
    setupLawbringerSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      loopProxy.setupLawbringerSpawnWithSignal({ exitCode, lines });
    },
    setupSiegemasterSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      loopProxy.setupSiegemasterSpawn({ exitCode });
    },
    setupSiegemasterSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      loopProxy.setupSiegemasterSpawnWithSignal({ exitCode, lines });
    },
    setupSignalQuestUpdate: ({ questJson }: { questJson: string }): void => {
      loopProxy.setupSignalQuestUpdate({ questJson });
    },
    getSignalWrittenQuestContent: (): unknown => loopProxy.getSignalWrittenQuestContent(),
  };
};
