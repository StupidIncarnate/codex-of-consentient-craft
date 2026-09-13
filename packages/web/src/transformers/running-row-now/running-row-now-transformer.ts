/**
 * PURPOSE: Resolves the `now` value a work-item row's transcript should tick against — the
 * panel's shared clock while the row is running, or nothing once it stops. Pulled out of
 * execution-row-layer-widget's render body because that arrow function already sits at the
 * `complexity: max 50` ceiling `eslintRuleStatics` enforces, and folding "is this row running"
 * together with "did the panel supply a reading" into one inline `&&` there is what tips it over.
 *
 * USAGE:
 * runningRowNowTransformer({ isRunning: true, now: someIsoTimestamp });
 * // Returns someIsoTimestamp
 * runningRowNowTransformer({ isRunning: false, now: someIsoTimestamp });
 * // Returns undefined — the row stopped, so its transcript gets no clock
 */

import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';

export const runningRowNowTransformer = ({
  isRunning,
  now,
}: {
  isRunning: boolean;
  now: IsoTimestamp | undefined;
}): IsoTimestamp | undefined => (isRunning ? now : undefined);
