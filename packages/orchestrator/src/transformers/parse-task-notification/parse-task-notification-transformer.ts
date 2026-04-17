/**
 * PURPOSE: Parses a <task-notification> XML string emitted by Claude CLI for background-agent completion into structured TaskNotificationData, or returns null if required fields are missing
 *
 * USAGE:
 * parseTaskNotificationTransformer({ content: '<task-notification><task-id>t1</task-id><status>completed</status></task-notification>' });
 * // Returns { taskId: 't1', status: 'completed', summary?, result?, totalTokens?, toolUses?, durationMs? } or null
 */

import { taskNotificationDataContract } from '../../contracts/task-notification-data/task-notification-data-contract';
import type { TaskNotificationData } from '../../contracts/task-notification-data/task-notification-data-contract';

const TASK_ID_PATTERN = /<task-id>(.*?)<\/task-id>/u;
const STATUS_PATTERN = /<status>(.*?)<\/status>/u;
const SUMMARY_PATTERN = /<summary>(.*?)<\/summary>/u;
const RESULT_PATTERN = /<result>([\s\S]*?)<\/result>/u;
const TOTAL_TOKENS_PATTERN = /<total_tokens>(\d+)<\/total_tokens>/u;
const TOOL_USES_PATTERN = /<tool_uses>(\d+)<\/tool_uses>/u;
const DURATION_MS_PATTERN = /<duration_ms>(\d+)<\/duration_ms>/u;
const DECIMAL_RADIX = 10;

export const parseTaskNotificationTransformer = ({
  content,
}: {
  content: string;
}): TaskNotificationData | null => {
  const taskIdMatch = TASK_ID_PATTERN.exec(content);
  const statusMatch = STATUS_PATTERN.exec(content);

  if (!taskIdMatch?.[1] || !statusMatch?.[1]) {
    return null;
  }

  const summaryMatch = SUMMARY_PATTERN.exec(content);
  const resultMatch = RESULT_PATTERN.exec(content);
  const totalTokensMatch = TOTAL_TOKENS_PATTERN.exec(content);
  const toolUsesMatch = TOOL_USES_PATTERN.exec(content);
  const durationMsMatch = DURATION_MS_PATTERN.exec(content);

  return taskNotificationDataContract.parse({
    taskId: taskIdMatch[1],
    status: statusMatch[1],
    ...(summaryMatch?.[1] ? { summary: summaryMatch[1] } : {}),
    ...(resultMatch?.[1] ? { result: resultMatch[1] } : {}),
    ...(totalTokensMatch?.[1] ? { totalTokens: parseInt(totalTokensMatch[1], DECIMAL_RADIX) } : {}),
    ...(toolUsesMatch?.[1] ? { toolUses: parseInt(toolUsesMatch[1], DECIMAL_RADIX) } : {}),
    ...(durationMsMatch?.[1] ? { durationMs: parseInt(durationMsMatch[1], DECIMAL_RADIX) } : {}),
  });
};
