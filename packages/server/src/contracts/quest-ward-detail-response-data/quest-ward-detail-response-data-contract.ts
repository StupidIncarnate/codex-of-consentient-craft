/**
 * PURPOSE: Defines the `data` QuestWardDetailResponder returns on success
 *
 * USAGE:
 * const data = questWardDetailResponseDataContract.parse(value);
 * // Returns validated QuestWardDetailResponseData
 */

import { z } from '#gateway/npm/zod';
import { wardDetailContract } from '@dungeonmaster/shared/contracts';

export const questWardDetailResponseDataContract = z
  .strictObject({ detail: wardDetailContract })
  .brand<'QuestWardDetailResponseData'>();

export type QuestWardDetailResponseData = z.infer<typeof questWardDetailResponseDataContract>;
