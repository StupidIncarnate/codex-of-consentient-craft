/**
 * PURPOSE: Formats a chat-output event payload into a readable dev log body by summarizing the ChatEntry[] payload
 *
 * USAGE:
 * devLogChatOutputFormatTransformer({ payload: { chatProcessId: 'replay-abc', entries: [{role: 'assistant', type: 'text', content: '...'}] } });
 * // Returns DevLogLine 'proc:replay-ab  assistant/text  "..."'
 */

import { chatEntryContract } from '@dungeonmaster/shared/contracts';

import {
  devLogLineContract,
  type DevLogLine,
} from '../../contracts/dev-log-line/dev-log-line-contract';
import { devLogChatEntrySummaryTransformer } from '../dev-log-chat-entry-summary/dev-log-chat-entry-summary-transformer';
import { devLogProcLabelTransformer } from '../dev-log-proc-label/dev-log-proc-label-transformer';

export const devLogChatOutputFormatTransformer = ({
  payload,
}: {
  payload: Record<PropertyKey, unknown>;
}): DevLogLine => {
  const procLabel = devLogProcLabelTransformer({ payload });
  const rawRole = Reflect.get(payload, 'role');
  const rolePart = typeof rawRole === 'string' ? `${rawRole}  ` : '';
  const slotIndex = Reflect.get(payload, 'slotIndex');
  const slotPart = typeof slotIndex === 'number' ? `slot:${slotIndex}  ` : '';

  const entries = Reflect.get(payload, 'entries');
  if (!Array.isArray(entries) || entries.length === 0) {
    return devLogLineContract.parse(`${procLabel}  ${rolePart}${slotPart}(no entries)`.trim());
  }

  const parts: DevLogLine[] = [];
  for (const candidate of entries) {
    const parseResult = chatEntryContract.safeParse(candidate);
    if (parseResult.success) {
      parts.push(devLogChatEntrySummaryTransformer({ entry: parseResult.data }));
    }
  }
  return devLogLineContract.parse(
    `${procLabel}  ${rolePart}${slotPart}${parts.join(' | ')}`.trim(),
  );
};
