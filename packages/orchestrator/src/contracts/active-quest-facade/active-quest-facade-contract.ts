/**
 * PURPOSE: Defines the minimal facade shape that questGetNextStepBroker and scanOnceLayerBroker accept for mutating active-quest state. Brokers can't import state/, so the caller (MCP responder) supplies the real activeQuestState methods; tests inject a stub matching this shape.
 *
 * USAGE:
 * const activeQuest: ActiveQuestFacade = { setActive, clear };
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

export interface ActiveQuestFacade {
  setActive: ({ questId }: { questId: Quest['id'] | null }) => void;
  clear: () => void;
}
