/**
 * PURPOSE: Atomically persists the dispatch state to <dungeonmasterHome>/dispatch-state.json
 * (temp file + rename) with a fresh updatedAt stamp. Ensures the home dir exists first so a
 * fresh install can flip play/pause before anything else touched the home.
 *
 * This writes the WHOLE state, so `mcpHeartbeatAt` and `hold` are dropped by any call that omits
 * them. Every caller therefore reads first and forwards what it is not changing — a pause press
 * that forgot to carry `hold` would silently lift a rate-limit hold and hand the queue back its
 * spent quota.
 *
 * USAGE:
 * const state = await dispatchStateWriteBroker({ mode: 'node-playing' });
 * // Returns the persisted DispatchState (updatedAt stamped to now)
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
  mode,
  mcpHeartbeatAt,
  hold,
}: {
  mode: DispatchState['mode'];
  mcpHeartbeatAt?: DispatchState['mcpHeartbeatAt'];
  hold?: DispatchState['hold'];
}): Promise<DispatchState> => {
  const state = dispatchStateContract.parse({
    mode,
    ...(mcpHeartbeatAt === undefined ? {} : { mcpHeartbeatAt }),
    // Omitting `hold` DROPS it, which is why every caller forwards the value it just read. An
    // explicit null is the deliberate clear, written when a hold's resumeAt has passed.
    ...(hold === undefined ? {} : { hold }),
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
