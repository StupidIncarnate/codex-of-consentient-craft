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
  if (parsed.chatProcessId !== undefined) {
    return devLogLineContract.parse(
      `proc:${devLogShortIdTransformer({ id: parsed.chatProcessId })}`,
    );
  }
  if (parsed.processId !== undefined) {
    return devLogLineContract.parse(`proc:${devLogShortIdTransformer({ id: parsed.processId })}`);
  }
  return devLogLineContract.parse('');
};
