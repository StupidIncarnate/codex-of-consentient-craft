/**
 * PURPOSE: Defines the structure of a quest phase with status and metadata
 *
 * USAGE:
 * questPhaseContract.parse({status: 'pending'});
 * // Returns: QuestPhase object
 */

import { z } from 'zod';

import { phaseStatusContract } from '../phase-status/phase-status-contract';

export const questPhaseContract = z.object({
  status: phaseStatusContract,
  report: z.string().brand<'ReportFilename'>().optional(),
  progress: z.string().brand<'PhaseProgress'>().optional(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
});

export type QuestPhase = z.infer<typeof questPhaseContract>;
