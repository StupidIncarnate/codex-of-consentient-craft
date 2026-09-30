/**
 * PURPOSE: Defines the data `recoverOrphanedWorkItemsLayerBroker` returns
 *
 * USAGE:
 * recoverOrphanedWorkItemsLayerResultContract.parse(value);
 * // Returns validated RecoverOrphanedWorkItemsLayerResult
 */
import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const recoverOrphanedWorkItemsLayerResultContract = z
  .object({ quest: questContract, blocked: z.boolean() })
  .brand<'RecoverOrphanedWorkItemsLayerResult'>();

export type RecoverOrphanedWorkItemsLayerResult = z.infer<
  typeof recoverOrphanedWorkItemsLayerResultContract
>;
