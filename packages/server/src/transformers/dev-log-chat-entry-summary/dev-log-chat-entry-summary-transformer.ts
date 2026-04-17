/**
 * PURPOSE: Summarizes a single ChatEntry object into a compact dev-log label fragment
 *
 * USAGE:
 * devLogChatEntrySummaryTransformer({ entry: { role: 'assistant', type: 'text', content: 'hi' } });
 * // Returns DevLogLine 'assistant/text  "hi"'
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import {
  devLogLineContract,
  type DevLogLine,
} from '../../contracts/dev-log-line/dev-log-line-contract';
import { devLogShortIdTransformer } from '../dev-log-short-id/dev-log-short-id-transformer';

const TEXT_PREVIEW_LENGTH = 60;

export const devLogChatEntrySummaryTransformer = ({ entry }: { entry: ChatEntry }): DevLogLine => {
  if (entry.role === 'user') {
    const text = String(entry.content);
    const preview =
      text.length > TEXT_PREVIEW_LENGTH ? `${text.slice(0, TEXT_PREVIEW_LENGTH)}...` : text;
    return devLogLineContract.parse(`user/text  "${preview}"`);
  }

  if (entry.role === 'assistant') {
    if (entry.type === 'tool_use') {
      return devLogLineContract.parse(`assistant/tool_use  ${String(entry.toolName)}`);
    }
    if (entry.type === 'text') {
      const text = String(entry.content);
      const preview =
        text.length > TEXT_PREVIEW_LENGTH ? `${text.slice(0, TEXT_PREVIEW_LENGTH)}...` : text;
      return devLogLineContract.parse(`assistant/text  "${preview}"`);
    }
    if (entry.type === 'thinking') {
      return devLogLineContract.parse('assistant/thinking');
    }
    const toolName = String(entry.toolName);
    const idLabel = toolName ? devLogShortIdTransformer({ id: toolName }) : '';
    const label = entry.isError ? 'error' : 'ok';
    return devLogLineContract.parse(`user/tool_result  ${idLabel}  ${label}`.trim());
  }

  if (entry.type === 'task_notification') {
    return devLogLineContract.parse(`system/task_notification  ${String(entry.status)}`);
  }
  return devLogLineContract.parse('system/error');
};
