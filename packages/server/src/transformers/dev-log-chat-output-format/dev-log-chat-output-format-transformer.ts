/**
 * PURPOSE: Formats a chat-output event payload into a readable dev log body by parsing the inner JSONL
 *
 * USAGE:
 * devLogChatOutputFormatTransformer({ payload: { chatProcessId: 'replay-abc', line: '{"type":"assistant",...}' } });
 * // Returns DevLogLine 'proc:replay-ab  assistant/tool_use  Read  .../file.ts'
 */

import {
  devLogLineContract,
  type DevLogLine,
} from '../../contracts/dev-log-line/dev-log-line-contract';
import { devLogInnerJsonlFormatTransformer } from '../dev-log-inner-jsonl-format/dev-log-inner-jsonl-format-transformer';
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

  const line = Reflect.get(payload, 'line');
  const entry = Reflect.get(payload, 'entry');
  const rawLine =
    typeof line === 'string'
      ? line
      : typeof entry === 'object' && entry !== null
        ? String(Reflect.get(entry, 'raw') ?? '')
        : '';

  try {
    const parsed = JSON.parse(rawLine) as Record<PropertyKey, unknown>;
    const innerLabel = devLogInnerJsonlFormatTransformer({ parsed });
    return devLogLineContract.parse(`${procLabel}  ${rolePart}${slotPart}${innerLabel}`.trim());
  } catch {
    return devLogLineContract.parse(`${procLabel}  ${rolePart}${slotPart}(unparseable)`.trim());
  }
};
