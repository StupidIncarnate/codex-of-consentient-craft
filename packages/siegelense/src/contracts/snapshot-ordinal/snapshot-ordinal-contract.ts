/**
 * PURPOSE: Numbers one snapshot's payload DIRECTORY inside an instance's snapshot store, counting
 * from 1 for the life of that instance. A directory number rather than the snapshot's own name,
 * because a name carries a colon and a caller may reuse one — re-snapshotting `clean` writes a second
 * payload rather than overwriting the first, and only a number keeps those two apart on disk. Reach
 * for this over `SnapshotName` whenever the value addresses a directory; the name addresses a
 * restore POINT, which may have been captured more than once.
 *
 * USAGE:
 * snapshotOrdinalContract.parse(3);
 * // Returns a branded SnapshotOrdinal
 */

import { z } from 'zod';

import { snapshotStatics } from '../../statics/snapshot/snapshot-statics';

export const snapshotOrdinalContract = z
  .number()
  .int()
  .min(snapshotStatics.numbering.firstPayload)
  .brand<'SnapshotOrdinal'>();

export type SnapshotOrdinal = z.infer<typeof snapshotOrdinalContract>;
