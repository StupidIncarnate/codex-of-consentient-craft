/**
 * PURPOSE: Defines the schema for a needs-role-followup signal sent when another agent role is needed
 *
 * USAGE:
 * const signal = needsRoleFollowupSignalContract.parse({ signal: 'needs-role-followup', stepId: '...', targetRole: '...', reason: '...', context: '...', resume: true });
 * // Returns validated needs-role-followup signal
 */
import { z } from 'zod';
import { stepIdContract } from '@dungeonmaster/shared/contracts';

export const needsRoleFollowupSignalContract = z.object({
  signal: z.literal('needs-role-followup').brand<'NeedsRoleFollowupSignalType'>(),
  stepId: stepIdContract,
  targetRole: z.string().min(1).brand<'SignalTargetRole'>(),
  reason: z.string().min(1).brand<'SignalReason'>(),
  context: z.string().min(1).brand<'SignalContext'>(),
  resume: z.boolean().brand<'SignalResume'>(),
});

export type NeedsRoleFollowupSignal = z.infer<typeof needsRoleFollowupSignalContract>;
