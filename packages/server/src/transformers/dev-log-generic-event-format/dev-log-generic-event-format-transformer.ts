/**
 * PURPOSE: Formats non-chat-output orchestration events into structured key:value dev log bodies
 *
 * USAGE:
 * devLogGenericEventFormatTransformer({ payload: { questId: '89362ba3-...', chatProcessId: 'replay-...' } });
 * // Returns DevLogLine 'quest:89362ba3  chat:e8c8ba78'
 */

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

  const questId = Reflect.get(payload, 'questId');
  const questPart =
    typeof questId === 'string' ? `  quest:${devLogShortIdTransformer({ id: questId })}` : '';

  const sessionId = Reflect.get(payload, 'sessionId');
  const sessionPart =
    typeof sessionId === 'string' ? `  session:${devLogShortIdTransformer({ id: sessionId })}` : '';

  const chatProcessId = Reflect.get(payload, 'chatProcessId');
  const shortChat =
    typeof chatProcessId === 'string' ? devLogShortIdTransformer({ id: chatProcessId }) : '';
  const chatPart = shortChat && !procLabel.includes(shortChat) ? `  chat:${shortChat}` : '';

  const phase = Reflect.get(payload, 'phase');
  const phasePart = typeof phase === 'string' ? `  phase:${phase}` : '';

  const slotIndex = Reflect.get(payload, 'slotIndex');
  const slotPart = typeof slotIndex === 'number' ? `  slot:${slotIndex}` : '';

  const role = Reflect.get(payload, 'role');
  const rolePart = typeof role === 'string' ? `  role:${role}` : '';

  const questions = Reflect.get(payload, 'questions');
  const questionsPart = Array.isArray(questions) ? `  questions:${questions.length}` : '';

  const caseId = Reflect.get(payload, 'caseId');
  const caseIdPart = typeof caseId === 'string' ? `  case:${caseId}` : '';

  const caseResult: unknown = Reflect.get(payload, 'caseResult');
  const caseResultId: unknown =
    caseResult !== null && typeof caseResult === 'object'
      ? Reflect.get(caseResult, 'caseId')
      : undefined;
  const caseResultPassed: unknown =
    caseResult !== null && typeof caseResult === 'object'
      ? Reflect.get(caseResult, 'passed')
      : undefined;
  const caseResultIdPart =
    typeof caseResultId === 'string' && caseIdPart === '' ? `  case:${caseResultId}` : '';
  const caseResultPassedPart =
    typeof caseResultPassed === 'boolean' ? `  ${caseResultPassed ? 'verified' : 'FAILED'}` : '';

  const suite = Reflect.get(payload, 'suite');
  const suitePart = typeof suite === 'string' ? `  suite:${suite}` : '';

  const total = Reflect.get(payload, 'total');
  const totalPart = typeof total === 'number' ? `  total:${total}` : '';

  const passed = Reflect.get(payload, 'passed');
  const passedPart =
    typeof passed === 'number' && typeof total === 'number' ? `  passed:${passed}/${total}` : '';

  const totalPartEffective = passedPart === '' ? totalPart : '';

  return devLogLineContract.parse(
    `${procLabel}${questPart}${sessionPart}${chatPart}${suitePart}${phasePart}${caseIdPart}${caseResultIdPart}${caseResultPassedPart}${slotPart}${rolePart}${questionsPart}${totalPartEffective}${passedPart}`.trim(),
  );
};
