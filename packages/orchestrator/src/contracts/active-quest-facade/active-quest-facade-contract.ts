/**
 * PURPOSE: Defines the minimal facade shape that questGetNextStepBroker and scanOnceLayerBroker accept for mutating active-quest state. Brokers can't import state/, so the caller (MCP responder) supplies the real activeQuestState methods; tests inject a stub matching this shape.
 *
 * USAGE:
 * activeQuestFacadeContract.parse(activeQuestState);
 * // Returns: ActiveQuestFacade — the runtime-validated facade object
 */

import { z } from '#gateway/npm/zod';

import type { QuestId } from '@dungeonmaster/shared/contracts';

// `setActive` and `clear` are functions — a Zod object schema cannot check callability, so both
// stay out of the parse and are attached only through the type intersection below.
// `.loose()` carries them through `.parse()` unvalidated when a real caller supplies one.
export const activeQuestFacadeContract = z.object({}).loose();

export type ActiveQuestFacade = z.infer<typeof activeQuestFacadeContract> & {
  setActive: ({ questId }: { questId: QuestId | null }) => void;
  clear: () => void;
};
