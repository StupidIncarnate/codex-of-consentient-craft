/**
 * PURPOSE: Defines a contract entry within a quest, representing a data contract, endpoint, or event schema
 *
 * USAGE:
 * questContractEntryContract.parse({id: 'uuid', name: 'LoginCredentials', kind: 'data', status: 'new', properties: [{name: 'email'}]});
 * // Returns: QuestContractEntry object with branded fields and validated sub-contracts
 */

import { z } from 'zod';

import { contractNameContract } from '../contract-name/contract-name-contract';
import { questContractKindContract } from '../quest-contract-kind/quest-contract-kind-contract';
import { questContractPropertyContract } from '../quest-contract-property/quest-contract-property-contract';
import { questContractStatusContract } from '../quest-contract-status/quest-contract-status-contract';

export const questContractEntryContract = z.object({
  id: z
    .string()
    .uuid()
    .brand<'QuestContractEntryId'>()
    .describe('Unique identifier for this contract entry'),
  name: contractNameContract.describe(
    'Contract name referenced by steps in inputContracts/outputContracts (e.g., "LoginCredentials", "AuthLoginEndpoint")',
  ),
  kind: questContractKindContract.describe(
    'Contract kind: "data" for Zod types, "endpoint" for API boundaries, "event" for EventEmitter/WebSocket schemas',
  ),
  status: questContractStatusContract.describe(
    'Whether this contract is "new" (created by quest), "existing" (already in codebase), or "modified" (existing contract being changed - properties show FINAL state)',
  ),
  source: z
    .string()
    .brand<'FilePath'>()
    .optional()
    .describe('File path where this contract lives or will be created'),
  properties: z
    .array(questContractPropertyContract)
    .describe(
      'The properties/fields that make up this contract. Supports nesting via recursive properties field',
    ),
});

export type QuestContractEntry = z.infer<typeof questContractEntryContract>;
