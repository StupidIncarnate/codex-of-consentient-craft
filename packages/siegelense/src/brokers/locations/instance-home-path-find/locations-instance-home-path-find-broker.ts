/**
 * PURPOSE: Resolves the absolute path to one instance's THROWAWAY home — the scratch directory a
 * booted lane's own processes use as `DUNGEONMASTER_HOME`/`HOME` (`laneSpecStatics`' `{home}`
 * placeholder), and the one `laneTeardownBroker` removes on `kill`. Lives under the OS scratch
 * directory rather than the siegelense root, mirroring `locationsSocketPathFindBroker` — this is
 * state a live lane owns for its own run, never evidence, so it has no business under
 * `<repoRoot>/.dungeonmaster-assets/siegelense-assets` where a reader's `Read` would go looking for something durable.
 *
 * USAGE:
 * locationsInstanceHomePathFindBroker({ instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }) });
 * // Returns AbsoluteFilePath '<os.tmpdir()>/dm-siege-inst_7f3a9c21'
 */

import { osTmpdirAdapter } from '../../../adapters/os/tmpdir/os-tmpdir-adapter';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const locationsInstanceHomePathFindBroker = ({
  instanceId,
}: {
  instanceId: InstanceId;
}): AbsoluteFilePath => {
  const tmpDir = osTmpdirAdapter();

  const joined = pathJoinAdapter({
    paths: [tmpDir, `${driverStatics.boot.homePrefix}${instanceId}`],
  });

  return absoluteFilePathContract.parse(joined);
};
