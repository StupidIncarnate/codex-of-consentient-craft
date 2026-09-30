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

import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

export const locationsSocketPathFindBroker = ({
  instanceId,
}: {
  instanceId: SiegeInstance['id'];
}): string => {
  const tmpDir = tmpdir();

  const joined = join(
    tmpDir,
    locationsStatics.siegelense.socketsDirName,
    `${instanceId}${evidenceFileStatics.extensions.socket}`,
  );

  return joined;
};
