/**
 * PURPOSE: Extracts a compact process label (proc:XXXXXXXX) from an event payload
 *
 * USAGE:
 * devLogProcLabelTransformer({ payload: { chatProcessId: 'replay-e8c8ba78-...' } });
 * // Returns DevLogLine 'proc:e8c8ba78'
 */

import { devLogEventPayloadContract } from '../../contracts/dev-log-event-payload/dev-log-event-payload-contract';
import {
  devLogLineContract,
  type DevLogLine,
} from '../../contracts/dev-log-line/dev-log-line-contract';
import { devLogShortIdTransformer } from '../dev-log-short-id/dev-log-short-id-transformer';

export const devLogProcLabelTransformer = ({
  payload,
}: {
  payload: Record<PropertyKey, unknown>;
}): DevLogLine => {
  const parsed = devLogEventPayloadContract.parse(payload);

  // `?? undefined` folds the explicit null an event uses for "never captured" into the same
  // absent case as a missing key, so a null id falls through to the next candidate rather than
  // reaching devLogShortIdTransformer.
  const chatProcessId = parsed.chatProcessId ?? undefined;
  const processId = parsed.processId ?? undefined;

  if (chatProcessId !== undefined) {
    return devLogLineContract.parse(`proc:${devLogShortIdTransformer({ id: chatProcessId })}`);
  }
  if (processId !== undefined) {
    return devLogLineContract.parse(`proc:${devLogShortIdTransformer({ id: processId })}`);
  }
  return devLogLineContract.parse('');
};
