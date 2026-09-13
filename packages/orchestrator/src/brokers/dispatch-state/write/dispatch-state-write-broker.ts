/**
 * PURPOSE: Atomically persists the dispatch state to <dungeonmasterHome>/dispatch-state.json
 * (temp file + rename) with a fresh updatedAt stamp, overriding whatever the caller passed for it.
 * Takes the whole `DispatchState` rather than its fields separately — every caller already holds
 * one (read fresh, or the current in-memory mirror), so it spreads that in with the one field it
 * means to change. Ensures the home dir exists first so a fresh install can flip play/pause before
 * anything else touched the home.
 *
 * This writes the WHOLE state, so `mcpHeartbeatAt` and `hold` are dropped by any call that omits
 * them. Every caller therefore reads first and forwards what it is not changing — a pause press
 * that forgot to carry `hold` would silently lift a rate-limit hold and hand the queue back its
 * spent quota.
 *
 * USAGE:
 * const state = await dispatchStateWriteBroker({ dispatchState: { ...current, mode: 'node-playing' } });
 * // Returns the persisted DispatchState (updatedAt stamped to now, regardless of what was passed)
 */

import type { DispatchState } from '@dungeonmaster/shared/contracts';
import {
  dispatchStateContract,
  fileContentsContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import {
  dungeonmasterHomeEnsureBroker,
  locationsDispatchStatePathFindBroker,
  locationsDispatchStateTmpPathFindBroker,
} from '@dungeonmaster/shared/brokers';

import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

export const dispatchStateWriteBroker = async ({
  dispatchState,
}: {
  dispatchState: DispatchState;
}): Promise<DispatchState> => {
  const state = dispatchStateContract.parse({
    // The whole state rides the spread, so a field a caller did not mention — `hold` especially —
    // survives rather than being dropped. An explicit `null` is still the deliberate clear, written
    // when a hold's resumeAt has passed.
    ...dispatchState,
    updatedAt: new Date().toISOString(),
  });

  await dungeonmasterHomeEnsureBroker();

  const statePath = locationsDispatchStatePathFindBroker();
  const tmpPath = locationsDispatchStateTmpPathFindBroker();

  const contents = fileContentsContract.parse(`${JSON.stringify(state)}\n`);
  await fsWriteFileAdapter({ filePath: filePathContract.parse(tmpPath), contents });
  await fsRenameAdapter({
    from: filePathContract.parse(tmpPath),
    to: filePathContract.parse(statePath),
  });

  return state;
};
