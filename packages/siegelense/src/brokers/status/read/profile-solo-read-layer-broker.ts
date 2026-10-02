/**
 * PURPOSE: The ONE measured sample `status`'s likelyCause compares a dead instance's own memory
 * reading against — the spec's SOLO (pool size 1) profile group, resolved the SAME way
 * `capacityReadBroker` resolves a profile (`profileReadBroker` keyed by `specName`, then
 * `capacitySampleSelectTransformer` to pick a sample group). Reach for this over calling
 * `profileReadBroker` directly from `instanceEntryLayerBroker`: a dead instance's likelyCause
 * reasons about ONE instance in isolation, never a contended pool, so pool size 1 is the fixed
 * comparison baseline regardless of how many instances happened to be running elsewhere when this
 * one died.
 *
 * A profile read that fails (an unknown spec name, an unconfigured `.dungeonmaster.json`) answers
 * `null` rather than throwing, and says nothing: a retired spec is the normal state of an old
 * registry row, and `status --since 1wk` reads one row per instance, so a line per failure
 * would bury the table. The row shows no profile line instead of a crashed `status` call.
 *
 * USAGE:
 * await profileSoloReadLayerBroker({ specName: 'stack', repoRoot });
 * // Returns the CapacityProfile at pool size 1, the pessimistic nearest group if none was ever
 * // measured solo, or null when the spec has no profile at all
 */

import type { CapacityProfile } from '../../../contracts/capacity-profile/capacity-profile-contract';
import { capacitySampleSelectTransformer } from '../../../transformers/capacity-sample-select/capacity-sample-select-transformer';
import { profileReadBroker } from '../../profile/read/profile-read-broker';

const SOLO_POOL_SIZE = 1;

export const profileSoloReadLayerBroker = async ({
  specName,
  repoRoot,
}: {
  specName: string;
  repoRoot: string;
}): Promise<CapacityProfile | null> => {
  const profile = await profileReadBroker({ specName, repoRoot }).catch((): null => null);

  if (profile === null) {
    return null;
  }

  return capacitySampleSelectTransformer({
    profile,
    poolSize: SOLO_POOL_SIZE,
  });
};
