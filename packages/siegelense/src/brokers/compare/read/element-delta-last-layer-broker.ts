/**
 * PURPOSE: The element delta ONE run actually recorded — the `delta` off the LAST step in that run's
 * transcript that carried a non-null one (`stepReadingContract`'s own `delta`, computed once per step
 * by `step-dispatch-broker.ts`). Reach for this over re-diffing two `KeyListing`s directly: `compare`
 * reads stored evidence only and never re-drives a page, so each run's own per-step deltas, already
 * flushed to its transcript, are the only element-level record available to it. `null` means the run
 * captured no acting step at all, or none of its steps produced a delta — the same "not compared"
 * meaning `stepReadingContract.delta` itself carries.
 *
 * USAGE:
 * elementDeltaLastLayerBroker({ rows: [ContentTextStub({ value: JSON.stringify(StepReadingStub()) })] });
 * // Returns the `delta` off the last row that carried a non-null one, or null when none did
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { ElementDelta } from '../../../contracts/element-delta/element-delta-contract';
import { stepReadingContract } from '../../../contracts/step-reading/step-reading-contract';

export const elementDeltaLastLayerBroker = ({
  rows,
}: {
  rows: readonly ContentText[];
}): ElementDelta | null => {
  const readings = rows.map((row) => stepReadingContract.parse(JSON.parse(row)));
  const lastWithDelta = [...readings].reverse().find((reading) => reading.delta !== null);

  return lastWithDelta?.delta ?? null;
};
