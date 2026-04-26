/**
 * PURPOSE: Formats non-chat-output orchestration events into structured key:value dev log bodies
 *
 * USAGE:
 * devLogGenericEventFormatTransformer({ payload: { questId: '89362ba3-...', chatProcessId: 'replay-...' } });
 * // Returns DevLogLine 'quest:89362ba3  chat:e8c8ba78'
 */

import { devLogEventPayloadContract } from '../../contracts/dev-log-event-payload/dev-log-event-payload-contract';
import {
  devLogLineContract,
  type DevLogLine,
} from '../../contracts/dev-log-line/dev-log-line-contract';
import { devLogProcLabelTransformer } from '../dev-log-proc-label/dev-log-proc-label-transformer';
import { devLogShortIdTransformer } from '../dev-log-short-id/dev-log-short-id-transformer';

export const devLogGenericEventFormatTransformer = ({
  payload,
}: {
  payload: Record<PropertyKey, unknown>;
}): DevLogLine => {
  const procLabel = devLogProcLabelTransformer({ payload });
  const parsed = devLogEventPayloadContract.parse(payload);

  const questPart =
    parsed.questId === undefined
      ? ''
      : `  quest:${devLogShortIdTransformer({ id: parsed.questId })}`;

  const sessionPart =
    parsed.sessionId === undefined
      ? ''
      : `  session:${devLogShortIdTransformer({ id: parsed.sessionId })}`;

  const shortChat =
    parsed.chatProcessId === undefined
      ? ''
      : devLogShortIdTransformer({ id: parsed.chatProcessId });
  const chatPart = shortChat && !procLabel.includes(shortChat) ? `  chat:${shortChat}` : '';

  const phasePart = parsed.phase === undefined ? '' : `  phase:${parsed.phase}`;

  const slotPart = parsed.slotIndex === undefined ? '' : `  slot:${parsed.slotIndex}`;

  const rolePart = parsed.role === undefined ? '' : `  role:${parsed.role}`;

  const questionsPart = Array.isArray(parsed.questions)
    ? `  questions:${parsed.questions.length}`
    : '';

  return devLogLineContract.parse(
    `${procLabel}${questPart}${sessionPart}${chatPart}${phasePart}${slotPart}${rolePart}${questionsPart}`.trim(),
  );
};
