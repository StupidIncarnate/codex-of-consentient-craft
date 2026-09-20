/**
 * PURPOSE: Which half of a run's automatic snapshot pair a capture is — the one taken before the
 * first step, or the one after the last (siegelense-tooling.md line 2630: "Every run also snapshots
 * automatically, at start and at end"). A closed two-member enum rather than a boolean, because
 * `snapshotAutoNameTransformer` maps each member onto its own suffix and a boolean would leave the
 * reader guessing which way round `true` runs. Reach for this over `SnapshotName`: this names the
 * boundary, the transformer turns it plus a run id into the name.
 *
 * USAGE:
 * snapshotBoundaryContract.parse('start');
 * // Returns a branded SnapshotBoundary
 */

import { z } from 'zod';

export const snapshotBoundaryContract = z.enum(['start', 'end']).brand<'SnapshotBoundary'>();

export type SnapshotBoundary = z.infer<typeof snapshotBoundaryContract>;
