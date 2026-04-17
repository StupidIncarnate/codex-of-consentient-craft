/**
 * PURPOSE: Defines the structured data extracted from a <task-notification> XML message emitted by Claude CLI when a background agent completes
 *
 * USAGE:
 * taskNotificationDataContract.parse({ taskId: 'acfc7f06a8ac21baf', status: 'completed', summary: 'Agent completed' });
 * // Returns validated TaskNotificationData carrying the background-agent result fields
 */

import { z } from 'zod';

export const taskNotificationDataContract = z.object({
  taskId: z.string().min(1).brand<'TaskNotificationTaskId'>(),
  status: z.string().min(1).brand<'TaskNotificationStatus'>(),
  summary: z.string().brand<'TaskNotificationSummary'>().optional(),
  result: z.string().brand<'TaskNotificationResult'>().optional(),
  totalTokens: z.number().int().min(0).brand<'TaskNotificationTotalTokens'>().optional(),
  toolUses: z.number().int().min(0).brand<'TaskNotificationToolUses'>().optional(),
  durationMs: z.number().int().min(0).brand<'TaskNotificationDurationMs'>().optional(),
});

export type TaskNotificationData = z.infer<typeof taskNotificationDataContract>;
