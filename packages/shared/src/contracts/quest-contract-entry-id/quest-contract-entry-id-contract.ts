/**
 * PURPOSE: Defines the branded kebab-case type for QuestContractEntry identifiers
 *
 * USAGE:
 * questContractEntryIdContract.parse('login-credentials');
 * // Returns: QuestContractEntryId branded string
 */

import { z } from 'zod';

export const questContractEntryIdContract = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)
  .brand<'QuestContractEntryId'>();

export type QuestContractEntryId = z.infer<typeof questContractEntryIdContract>;
