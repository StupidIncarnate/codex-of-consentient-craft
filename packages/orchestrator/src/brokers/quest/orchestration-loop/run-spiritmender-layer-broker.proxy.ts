import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

export const runSpiritmenderLayerBrokerProxy = (): {
  setupQuestLoad: (params: { questJson: string }) => void;
  setupQuestLoadError: (params: { error: Error }) => void;
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
} => {
  const questLoadProxy = questLoadBrokerProxy();
  const slotManagerProxy = slotManagerOrchestrateBrokerProxy();

  return {
    setupQuestLoad: ({ questJson }: { questJson: string }): void => {
      questLoadProxy.setupQuestFile({ questJson });
    },
    setupQuestLoadError: ({ error }: { error: Error }): void => {
      questLoadProxy.setupQuestFileReadError({ error });
    },
    setupSpawnAndMonitor: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      slotManagerProxy.setupSpawnAndMonitor({ lines, exitCode });
    },
  };
};
