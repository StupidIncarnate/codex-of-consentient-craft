/**
 * PURPOSE: Extracts the first 8 hex characters from a UUID or ID string for compact dev log display
 *
 * USAGE:
 * devLogShortIdTransformer({ id: '89362ba3-918c-4408-aeb1-f8f4ce8400cb' });
 * // Returns DevLogLine '89362ba3'
 */

import {
  devLogLineContract,
  type DevLogLine,
} from '../../contracts/dev-log-line/dev-log-line-contract';

const SHORT_ID_LENGTH = 8;

export const devLogShortIdTransformer = ({ id }: { id: string }): DevLogLine => {
  const match = /[0-9a-f]{8}/u.exec(id);
  return devLogLineContract.parse(match ? match[0] : id.slice(0, SHORT_ID_LENGTH));
};
