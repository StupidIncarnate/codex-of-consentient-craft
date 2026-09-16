/**
 * PURPOSE: Reads one instance's `heartbeat.json` back off disk — the file `status` reads once the
 * process that wrote it is gone, since nothing in memory survives a SIGKILL to hand the pgids or the
 * last measured rss back (siegelense-tooling.md line 1672). `null` covers ONLY the file's absence
 * (ENOENT) — an instance that never got as far as its first beat, or one whose evidence was already
 * reaped — never a guess dressed up as a reading. Any other read failure (EACCES, a truncated write)
 * propagates: swallowing it would make a post-mortem report a clean absence for a beat that is
 * actually there but unreadable.
 *
 * USAGE:
 * await heartbeatReadBroker({ instanceId: InstanceIdStub(), guildId: null });
 * // Returns the parsed InstanceHeartbeat, or null if heartbeat.json does not exist
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { GuildId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { instanceHeartbeatContract } from '../../../contracts/instance-heartbeat/instance-heartbeat-contract';
import type { InstanceHeartbeat } from '../../../contracts/instance-heartbeat/instance-heartbeat-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';

export const heartbeatReadBroker = async ({
  instanceId,
  guildId,
}: {
  instanceId: InstanceId;
  guildId: GuildId | null;
}): Promise<InstanceHeartbeat | null> => {
  const evidenceDir = locationsInstanceEvidencePathFindBroker({ instanceId, guildId });
  const heartbeatPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [evidenceDir, locationsStatics.siegelense.heartbeat] }),
  );

  const content = await fsReadFileAdapter({ filePath: heartbeatPath }).catch((error: unknown) => {
    if (
      error !== null &&
      typeof error === 'object' &&
      errorIsNativeErrorAdapter({ value: error }) &&
      'cause' in error &&
      error.cause !== null &&
      typeof error.cause === 'object' &&
      errorIsNativeErrorAdapter({ value: error.cause }) &&
      'code' in error.cause &&
      error.cause.code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  });

  if (content === null) {
    return null;
  }

  return instanceHeartbeatContract.parse(JSON.parse(content));
};
