/**
 * PURPOSE: Resolves a `SpecName` to its branded `LaneSpec`, off `laneSpecStatics` — the one place
 * the raw (unbranded) built-in specs get parsed, since `statics/` may import only other statics and
 * can never call `laneSpecContract.parse` itself. Reach for this over reading `laneSpecStatics`
 * directly whenever the caller needs a validated `LaneSpec` rather than the raw template object.
 *
 * USAGE:
 * laneSpecFindBroker({ specName: SpecNameStub({ value: 'dungeonmaster-headless' }) });
 * // Returns the validated LaneSpec for the browserless built-in
 */

import { laneSpecContract } from '../../../contracts/lane-spec/lane-spec-contract';
import type { LaneSpec } from '../../../contracts/lane-spec/lane-spec-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { laneSpecStatics } from '../../../statics/lane-spec/lane-spec-statics';

export const laneSpecFindBroker = ({ specName }: { specName: SpecName }): LaneSpec => {
  const knownSpecs: Record<SpecName, unknown> = laneSpecStatics.specs;

  if (!Object.hasOwn(knownSpecs, specName)) {
    throw new Error(
      `Unknown lane spec "${specName}". Known specs: ${Object.keys(laneSpecStatics.specs).join(', ')}`,
    );
  }

  return laneSpecContract.parse(knownSpecs[specName]);
};
