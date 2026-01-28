import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';
import { questUpdateStepBrokerProxy } from '../../quest/update-step/quest-update-step-broker.proxy';
import { handleSignalLayerBrokerProxy } from './handle-signal-layer-broker.proxy';
import { spawnAgentLayerBrokerProxy } from './spawn-agent-layer-broker.proxy';

export const orchestrationLoopLayerBrokerProxy = (): {
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
  const questLoadProxy = questLoadBrokerProxy();
  const questUpdateStepProxy = questUpdateStepBrokerProxy();
  const spawnAgentProxy = spawnAgentLayerBrokerProxy();
  const handleSignalProxy = handleSignalLayerBrokerProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    setupQuestLoad: ({ questJson }: { questJson: string }): void => {
      questLoadProxy.setupQuestFile({ questJson });
    },
    setupQuestLoadError: ({ error }: { error: Error }): void => {
      questLoadProxy.setupQuestFileReadError({ error });
    },
    setupQuestUpdateRead: ({ questJson }: { questJson: string }): void => {
      questUpdateStepProxy.setupQuestRead({ questJson });
    },
    setupQuestUpdateWrite: (): void => {
      questUpdateStepProxy.setupQuestWriteSuccess();
    },
    getQuestWrittenContent: (): unknown => questUpdateStepProxy.getQuestWrittenContent(),
    getQuestWrittenPath: (): unknown => questUpdateStepProxy.getQuestWrittenPath(),
    setupPathseekerSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnAgentProxy.setupPathseekerSuccess({ exitCode });
    },
    setupPathseekerSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      spawnAgentProxy.setupPathseekerSuccessWithSignal({ exitCode, lines });
    },
    setupPathseekerCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnAgentProxy.setupPathseekerCrash({ exitCode });
    },
    setupCodeweaverSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnAgentProxy.setupCodeweaverSuccess({ exitCode });
    },
    setupCodeweaverSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      spawnAgentProxy.setupCodeweaverSuccessWithSignal({ exitCode, lines });
    },
    setupCodeweaverTimeout: (): void => {
      spawnAgentProxy.setupCodeweaverTimeout();
    },
    setupCodeweaverCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnAgentProxy.setupCodeweaverCrash({ exitCode });
    },
    setupSpiritmenderSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnAgentProxy.setupSpiritmenderSuccess({ exitCode });
    },
    setupSpiritmenderSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      spawnAgentProxy.setupSpiritmenderSuccessWithSignal({ exitCode, lines });
    },
    setupSpiritmenderError: ({ error }: { error: Error }): void => {
      spawnAgentProxy.setupSpiritmenderError({ error });
    },
    setupLawbringerSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnAgentProxy.setupLawbringerSuccess({ exitCode });
    },
    setupLawbringerSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      spawnAgentProxy.setupLawbringerSuccessWithSignal({ exitCode, lines });
    },
    setupSiegemasterSpawn: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnAgentProxy.setupSiegemasterSuccess({ exitCode });
    },
    setupSiegemasterSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      spawnAgentProxy.setupSiegemasterSuccessWithSignal({ exitCode, lines });
    },
    setupSignalQuestUpdate: ({ questJson }: { questJson: string }): void => {
      handleSignalProxy.setupQuestUpdateSuccess({ questJson });
    },
    getSignalWrittenQuestContent: (): unknown => handleSignalProxy.getWrittenQuestContent(),
  };
};
