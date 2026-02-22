/**
 * PURPOSE: Parses task-notification XML from user message content into a structured ChatEntry
 *
 * USAGE:
 * parseTaskNotificationTransformer({content: '<task-notification><task-id>t1</task-id><status>completed</status></task-notification>'});
 * // Returns {role: 'system', type: 'task_notification', taskId: 't1', status: 'completed'} as ChatEntry
 */

import { chatEntryContract } from '../../contracts/chat-entry/chat-entry-contract';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';

export const parseTaskNotificationTransformer = ({
  content,
}: {
  content: string;
}): ChatEntry | null => {
  const taskIdMatch = /<task-id>(.*?)<\/task-id>/u.exec(content);
  const statusMatch = /<status>(.*?)<\/status>/u.exec(content);

  if (!taskIdMatch?.[1] || !statusMatch?.[1]) {
    return null;
  }

  const summaryMatch = /<summary>(.*?)<\/summary>/u.exec(content);
  const resultMatch = /<result>([\s\S]*?)<\/result>/u.exec(content);
  const totalTokensMatch = /<total_tokens>(\d+)<\/total_tokens>/u.exec(content);
  const toolUsesMatch = /<tool_uses>(\d+)<\/tool_uses>/u.exec(content);
  const durationMsMatch = /<duration_ms>(\d+)<\/duration_ms>/u.exec(content);

  return chatEntryContract.parse({
    role: 'system',
    type: 'task_notification',
    taskId: taskIdMatch[1],
    status: statusMatch[1],
    ...(summaryMatch?.[1] ? { summary: summaryMatch[1] } : {}),
    ...(resultMatch?.[1] ? { result: resultMatch[1] } : {}),
    ...(totalTokensMatch?.[1] ? { totalTokens: parseInt(totalTokensMatch[1], 10) } : {}),
    ...(toolUsesMatch?.[1] ? { toolUses: parseInt(toolUsesMatch[1], 10) } : {}),
    ...(durationMsMatch?.[1] ? { durationMs: parseInt(durationMsMatch[1], 10) } : {}),
  });
};
