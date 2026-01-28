import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

export const pathseekerPhaseLayerBrokerProxy = (): {
  setupQuestFile: (params: { questJson: string }) => void;
  setupQuestFileError: (params: { error: Error }) => void;
  setupQuestUpdateRead: (params: { questJson: string }) => void;
  setupQuestUpdateWrite: () => void;
  setupAgentSpawnWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupSignalQuestUpdate: (params: { questJson: string }) => void;
} => {
  const slotManagerProxy = slotManagerOrchestrateBrokerProxy();

  return {
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      slotManagerProxy.setupQuestLoad({ questJson });
    },
    setupQuestFileError: ({ error }: { error: Error }): void => {
      slotManagerProxy.setupQuestLoadError({ error });
    },
    setupQuestUpdateRead: ({ questJson }: { questJson: string }): void => {
      slotManagerProxy.setupQuestUpdateRead({ questJson });
    },
    setupQuestUpdateWrite: (): void => {
      slotManagerProxy.setupQuestUpdateWrite();
    },
    setupAgentSpawnWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      slotManagerProxy.setupPathseekerSpawnWithSignal({ exitCode, lines });
    },
    setupSignalQuestUpdate: ({ questJson }: { questJson: string }): void => {
      slotManagerProxy.setupSignalQuestUpdate({ questJson });
    },
  };
};
