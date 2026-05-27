/**
 * PURPOSE: Defines the minimal facade shape that questGetNextStepBroker and scanOnceLayerBroker accept for mutating active-quest state. Brokers can't import state/, so the caller (MCP responder) supplies the real activeQuestState methods; tests inject a stub matching this shape.
 *
 * USAGE:
 * activeQuestFacadeContract.parse(activeQuestState);
 * // Returns: ActiveQuestFacade — the runtime-validated facade object
 */

import { z } from 'zod';

import { questIdContract } from '@dungeonmaster/shared/contracts';

export const activeQuestFacadeContract = z.object({
  setActive: z
    .function()
    .args(z.object({ questId: questIdContract.nullable() }))
    .returns(z.void()),
  clear: z.function().args().returns(z.void()),
});

export type ActiveQuestFacade = z.infer<typeof activeQuestFacadeContract>;
