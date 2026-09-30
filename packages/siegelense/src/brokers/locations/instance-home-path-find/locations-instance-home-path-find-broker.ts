/**
 * PURPOSE: Resolves the absolute path to one instance's THROWAWAY home — the scratch directory a
 * booted lane's own processes use as `DUNGEONMASTER_HOME`/`HOME` (the `{home}` placeholder
 * `lanePlaceholderSubstituteTransformer` substitutes), and the one `laneTeardownBroker` removes on
 * `kill`. Lives under the OS scratch
 * directory rather than the siegelense root, mirroring `locationsSocketPathFindBroker` — this is
 * state a live lane owns for its own run, never evidence, so it has no business under
 * `<repoRoot>/.dungeonmaster-assets/siegelense-assets` where a reader's `Read` would go looking for something durable.
 *
 * USAGE:
 * locationsInstanceHomePathFindBroker({ instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }) });
 * // Returns AbsoluteFilePath '<os.tmpdir()>/dm-siege-inst_7f3a9c21'
 */

import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { driverStatics } from '../../../statics/driver/driver-statics';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

export const locationsInstanceHomePathFindBroker = ({
  instanceId,
}: {
  instanceId: SiegeInstance['id'];
}): AbsoluteFilePath => {
  const tmpDir = tmpdir();

  const joined = join(tmpDir, `${driverStatics.boot.homePrefix}${instanceId}`);

  return absoluteFilePathContract.parse(joined);
};
