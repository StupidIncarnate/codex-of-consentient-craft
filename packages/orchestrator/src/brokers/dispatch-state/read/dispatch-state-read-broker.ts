/**
 * PURPOSE: Reads the cross-process dispatch state from <dungeonmasterHome>/dispatch-state.json.
 * Missing or corrupt file resolves to the safe default: paused, never updated.
 *
 * USAGE:
 * const state = await dispatchStateReadBroker();
 * // Returns DispatchState — { mode: 'paused', updatedAt: '1970-01-01T00:00:00.000Z' } when absent
 */

import type { DispatchState } from '@dungeonmaster/shared/contracts';
import { dispatchStateContract, filePathContract } from '@dungeonmaster/shared/contracts';
import { locationsDispatchStatePathFindBroker } from '@dungeonmaster/shared/brokers';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { dispatchStateDefaultStatics } from '../../../statics/dispatch-state-default/dispatch-state-default-statics';

export const dispatchStateReadBroker = async (): Promise<DispatchState> => {
  const statePath = locationsDispatchStatePathFindBroker();

  try {
    const contents = await fsReadFileAdapter({
      filePath: filePathContract.parse(statePath),
    });
    return dispatchStateContract.parse(JSON.parse(contents));
  } catch {
    // Missing or corrupt state file — never auto-play; fall back to paused.
    return dispatchStateContract.parse(dispatchStateDefaultStatics.paused);
  }
};
