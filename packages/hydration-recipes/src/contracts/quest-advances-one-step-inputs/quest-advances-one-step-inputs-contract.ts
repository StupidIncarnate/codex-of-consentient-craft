/**
 * PURPOSE: What the `quest-advances-one-step` recipe needs from an earlier step — an existing
 * guild's own id. Reach for this over a `questId`: see
 * `quest-advances-one-step-recipe-broker.ts`'s own header for why this recipe seeds a FRESH quest
 * under that guild rather than reaching into one an earlier step already made.
 *
 * USAGE:
 * questAdvancesOneStepInputsContract.parse({ guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
 * // Returns QuestAdvancesOneStepInputs
 */
import { z } from 'zod';

import { guildIdContract } from '@dungeonmaster/shared/contracts';

export const questAdvancesOneStepInputsContract = z.object({
  guildId: guildIdContract,
});

export type QuestAdvancesOneStepInputs = z.infer<typeof questAdvancesOneStepInputsContract>;
