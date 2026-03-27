/**
 * PURPOSE: Extracts a compact process label (proc:XXXXXXXX) from an event payload
 *
 * USAGE:
 * devLogProcLabelTransformer({ payload: { chatProcessId: 'replay-e8c8ba78-...' } });
 * // Returns DevLogLine 'proc:e8c8ba78'
 */

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
  const chatProcessId = Reflect.get(payload, 'chatProcessId');
  const processId = Reflect.get(payload, 'processId');
  const pid =
    typeof chatProcessId === 'string'
      ? chatProcessId
      : typeof processId === 'string'
        ? processId
        : '';
  return devLogLineContract.parse(pid ? `proc:${devLogShortIdTransformer({ id: pid })}` : '');
};
