/**
 * PURPOSE: Toggles the web-presence flag that gates the cross-guild quest execution queue runner — true resumes/drains, false pauses the active head
 *
 * USAGE:
 * ExecutionQueueSetWebPresenceResponder({ isPresent: true });
 * // Forwards to webPresenceState.setPresent; pub/sub fires only if the value changes.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { webPresenceState } from '../../../state/web-presence/web-presence-state';

export const ExecutionQueueSetWebPresenceResponder = ({
  isPresent,
}: {
  isPresent: boolean;
}): AdapterResult => {
  webPresenceState.setPresent({ isPresent });
  return adapterResultContract.parse({ success: true });
};
