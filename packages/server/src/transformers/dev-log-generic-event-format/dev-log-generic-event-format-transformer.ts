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

  // `?? undefined` folds the explicit null an event uses for "never captured" into the same absent
  // case as a missing key, so a null renders as an omitted part rather than the text "null".
  const questId = parsed.questId ?? undefined;
  const sessionId = parsed.sessionId ?? undefined;
  const chatProcessId = parsed.chatProcessId ?? undefined;
  const phase = parsed.phase ?? undefined;
  const slotIndex = parsed.slotIndex ?? undefined;
  const role = parsed.role ?? undefined;

  const questPart =
    questId === undefined ? '' : `  quest:${devLogShortIdTransformer({ id: questId })}`;

  const sessionPart =
    sessionId === undefined ? '' : `  session:${devLogShortIdTransformer({ id: sessionId })}`;

  const shortChat =
    chatProcessId === undefined ? '' : devLogShortIdTransformer({ id: chatProcessId });
  const chatPart = shortChat && !procLabel.includes(shortChat) ? `  chat:${shortChat}` : '';

  const phasePart = phase === undefined ? '' : `  phase:${phase}`;

  const slotPart = slotIndex === undefined ? '' : `  slot:${slotIndex}`;

  const rolePart = role === undefined ? '' : `  role:${role}`;

  const questionsPart = Array.isArray(parsed.questions)
    ? `  questions:${parsed.questions.length}`
    : '';

  return devLogLineContract.parse(
    `${procLabel}${questPart}${sessionPart}${chatPart}${phasePart}${slotPart}${rolePart}${questionsPart}`.trim(),
  );
};
