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
 * `null` rather than throwing: a post-mortem reading for an instance whose spec has since moved on
 * is still worth showing without a profile line, not a crashed `status` call.
 *
 * USAGE:
 * await profileSoloReadLayerBroker({ specName: SpecNameStub({ value: 'stack' }) });
 * // Returns the CapacityProfile at pool size 1, the pessimistic nearest group if none was ever
 * // measured solo, or null when the spec has no profile at all
 */

import { stderr } from '#gateway/node/process';
import type { CapacityProfile } from '../../../contracts/capacity-profile/capacity-profile-contract';
import { profilePoolSizeContract } from '../../../contracts/profile-pool-size/profile-pool-size-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { capacitySampleSelectTransformer } from '../../../transformers/capacity-sample-select/capacity-sample-select-transformer';
import { profileReadBroker } from '../../profile/read/profile-read-broker';

const SOLO_POOL_SIZE = 1;

export const profileSoloReadLayerBroker = async ({
  specName,
}: {
  specName: SpecName;
}): Promise<CapacityProfile | null> => {
  const profile = await profileReadBroker({ specName }).catch((error: unknown) => {
    stderr.write(
      `[profile-solo-read] could not read the profile for spec ${specName}: ${String(error)}\n`,
    );
    return null;
  });

  if (profile === null) {
    return null;
  }

  return capacitySampleSelectTransformer({
    profile,
    poolSize: profilePoolSizeContract.parse(SOLO_POOL_SIZE),
  });
};
