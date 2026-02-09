/**
 * PURPOSE: Proxy for useQuestsListBinding that delegates to orchestrator adapter proxy
 *
 * USAGE:
 * const proxy = useQuestsListBindingProxy();
 * proxy.setupQuests({ quests });
 */
import type { QuestListItem } from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsAdapterProxy } from '../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';

export const useQuestsListBindingProxy = (): {
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupError: (params: { error: Error }) => void;
} => {
  const adapterProxy = orchestratorListQuestsAdapterProxy();

  return {
    setupQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      adapterProxy.returns({ quests });
    },
    setupError: ({ error }: { error: Error }): void => {
      adapterProxy.throws({ error });
    },
  };
};
