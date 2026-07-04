/**
 * PURPOSE: Atomically persists the dispatch state to <dungeonmasterHome>/dispatch-state.json
 * (temp file + rename) with a fresh updatedAt stamp. Ensures the home dir exists first so a
 * fresh install can flip play/pause before anything else touched the home.
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
}: {
  mode: DispatchState['mode'];
  mcpHeartbeatAt?: DispatchState['mcpHeartbeatAt'];
}): Promise<DispatchState> => {
  const state = dispatchStateContract.parse({
    mode,
    ...(mcpHeartbeatAt === undefined ? {} : { mcpHeartbeatAt }),
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
