/**
 * PURPOSE: Resolves the absolute path to one instance's driver socket. Lives under the OS scratch
 * directory rather than composing `locationsRootPathFindBroker()` like every other resolver in this
 * package — AF_UNIX caps `sun_path` at 108 bytes on Linux, and a repo checked out several directories
 * deep would blow that ceiling long before an instance id even enters the path. `os.tmpdir()` is
 * short on every platform this package targets, which is the whole reason the socket lives there
 * instead of under the siegelense root.
 *
 * USAGE:
 * locationsSocketPathFindBroker({ instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }) });
 * // Returns AbsoluteFilePath '<os.tmpdir()>/dm-siege-sockets/inst_7f3a9c21.sock'
 */

import { osTmpdirAdapter } from '../../../adapters/os/tmpdir/os-tmpdir-adapter';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';

export const locationsSocketPathFindBroker = ({
  instanceId,
}: {
  instanceId: InstanceId;
}): AbsoluteFilePath => {
  const tmpDir = osTmpdirAdapter();

  const joined = pathJoinAdapter({
    paths: [
      tmpDir,
      locationsStatics.siegelense.socketsDirName,
      `${instanceId}${evidenceFileStatics.extensions.socket}`,
    ],
  });

  return absoluteFilePathContract.parse(joined);
};
