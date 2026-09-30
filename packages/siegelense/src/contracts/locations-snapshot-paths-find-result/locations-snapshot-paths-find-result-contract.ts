/**
 * PURPOSE: Defines the data `locationsSnapshotPathsFindBroker` returns
 *
 * USAGE:
 * locationsSnapshotPathsFindResultContract.parse(value);
 * // Returns validated LocationsSnapshotPathsFindResult
 */
import { z } from '#gateway/npm/zod';

export const locationsSnapshotPathsFindResultContract = z
  .object({
    storeDir: z.string().brand<'LocationsSnapshotPathsFindResultStoreDir'>(),
    index: z.string().brand<'LocationsSnapshotPathsFindResultIndex'>(),
    payload: z.string().brand<'LocationsSnapshotPathsFindResultPayload'>(),
  })
  .brand<'LocationsSnapshotPathsFindResult'>();

export type LocationsSnapshotPathsFindResult = z.infer<
  typeof locationsSnapshotPathsFindResultContract
>;
