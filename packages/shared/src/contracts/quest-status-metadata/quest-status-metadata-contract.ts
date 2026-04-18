/**
 * PURPOSE: Per-quest-status metadata schema capturing every flag and derived value read by guards and transformers
 *
 * USAGE:
 * const metadata = questStatusMetadataContract.parse({...});
 * // Returns a validated QuestStatusMetadata object
 */

import { z } from 'zod';

import { questStatusContract } from '../quest-status/quest-status-contract';
import { displayHeaderContract } from '../display-header/display-header-contract';

export const questStatusMetadataContract = z.object({
  isPreExecution: z.boolean(),
  isPathseekerRunning: z.boolean(),
  isAnyAgentRunning: z.boolean(),
  isActivelyExecuting: z.boolean(),
  isUserPaused: z.boolean(),
  isQuestBlocked: z.boolean(),
  isTerminal: z.boolean(),
  isPauseable: z.boolean(),
  isResumable: z.boolean(),
  isStartable: z.boolean(),
  isRecoverable: z.boolean(),
  /**
   * On restart, the recovery responder re-launches the orchestration loop for
   * quests in this status and resets orphaned `in_progress` work items to
   * `pending`. No quest status transition happens — it's stateless recovery.
   *
   * Currently only `in_progress` sets this flag to true.
   */
  isAutoResumable: z.boolean(),
  isGateApproved: z.boolean(),
  isDesignPhase: z.boolean(),
  shouldRenderExecutionPanel: z.boolean(),
  nextApprovalStatus: questStatusContract.nullable(),
  previousReviewStatus: questStatusContract.nullable(),
  displayHeader: displayHeaderContract,
});

export type QuestStatusMetadata = z.infer<typeof questStatusMetadataContract>;
