/**
 * PURPOSE: Resolves the dungeonmaster server port — env var, then .dungeonmaster.json config walked up from cwd, then default
 *
 * USAGE:
 * const port = portResolveBroker();
 * // DUNGEONMASTER_PORT env → config.dungeonmaster.port → environmentStatics.defaultPort
 *
 * const port = portResolveBroker({ startDir: absoluteFilePathContract.parse('/path/to/project') });
 * // Same ladder, walks up from startDir instead of process.cwd()
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  networkPortContract,
  type NetworkPort,
} from '../../../contracts/network-port/network-port-contract';
import { environmentStatics } from '../../../statics/environment/environment-statics';
import { portConfigWalkBroker } from '../config-walk/port-config-walk-broker';
import { processCwdAdapter } from '../../../adapters/process/cwd/process-cwd-adapter';

export const portResolveBroker = ({
  startDir,
}: {
  startDir?: AbsoluteFilePath;
} = {}): NetworkPort => {
  const envPort = process.env.DUNGEONMASTER_PORT;
  if (envPort !== undefined && envPort !== '') {
    const parsed = Number(envPort);
    if (Number.isFinite(parsed) && parsed > 0) {
      return networkPortContract.parse(parsed);
    }
  }

  const lookupDir = startDir ?? absoluteFilePathContract.parse(processCwdAdapter());
  const configPort = portConfigWalkBroker({ dir: lookupDir });
  if (configPort !== undefined) {
    return configPort;
  }

  return networkPortContract.parse(environmentStatics.defaultPort);
};
