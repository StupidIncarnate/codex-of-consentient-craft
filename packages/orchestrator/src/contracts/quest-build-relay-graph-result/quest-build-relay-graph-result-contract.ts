/**
 * PURPOSE: Defines the data `questBuildRelayGraphBroker` returns
 *
 * USAGE:
 * questBuildRelayGraphResultContract.parse(value);
 * // Returns validated QuestBuildRelayGraphResult
 */
import { z } from '#gateway/npm/zod';
import { operationItemContract, workItemContract } from '@dungeonmaster/shared/contracts';

export const questBuildRelayGraphResultContract = z
  .object({ operations: z.array(operationItemContract), workItems: z.array(workItemContract) })
  .brand<'QuestBuildRelayGraphResult'>();

export type QuestBuildRelayGraphResult = z.infer<typeof questBuildRelayGraphResultContract>;
