import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

export const codeweaverPhaseLayerBrokerProxy = (): {
  setupQuestFile: (params: { questJson: string }) => void;
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
      slotManagerProxy.setupCodeweaverSpawnWithSignal({ exitCode, lines });
    },
    setupSignalQuestUpdate: ({ questJson }: { questJson: string }): void => {
      slotManagerProxy.setupSignalQuestUpdate({ questJson });
    },
  };
};
