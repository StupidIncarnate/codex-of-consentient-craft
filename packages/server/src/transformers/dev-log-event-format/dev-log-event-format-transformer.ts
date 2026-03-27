/**
 * PURPOSE: Transforms orchestration event data into human-readable dev log lines with icons and structured fields
 *
 * USAGE:
 * devLogEventFormatTransformer({ type: 'chat-output', payload: { chatProcessId: 'replay-abc', line: '...' } });
 * // Returns DevLogLine '◂  chat-output  proc:replay-ab  assistant/tool_use  Read  .../file.ts'
 */

import type { OrchestrationEventType } from '@dungeonmaster/shared/contracts';

import {
  devLogLineContract,
  type DevLogLine,
} from '../../contracts/dev-log-line/dev-log-line-contract';
import { devLogEventIconsStatics } from '../../statics/dev-log-event-icons/dev-log-event-icons-statics';
import { devLogChatOutputFormatTransformer } from '../dev-log-chat-output-format/dev-log-chat-output-format-transformer';
import { devLogGenericEventFormatTransformer } from '../dev-log-generic-event-format/dev-log-generic-event-format-transformer';

export const devLogEventFormatTransformer = ({
  type,
  payload,
}: {
  type: OrchestrationEventType;
  payload: Record<PropertyKey, unknown>;
}): DevLogLine => {
  const iconValue: unknown = Reflect.get(devLogEventIconsStatics.icons, type);
  const icon = typeof iconValue === 'string' ? iconValue : '· ';

  const body =
    type === 'chat-output'
      ? devLogChatOutputFormatTransformer({ payload })
      : devLogGenericEventFormatTransformer({ payload });

  return devLogLineContract.parse(`${icon} ${type}  ${body}`.trim());
};
