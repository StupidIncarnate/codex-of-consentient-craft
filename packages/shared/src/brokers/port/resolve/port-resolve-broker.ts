/**
 * PURPOSE: Resolves the dungeonmaster server port — env var, then .dungeonmaster.json config walked up from startDir, then default
 *
 * USAGE:
 * const port = portResolveBroker({ startDir: '/path/to/project' });
 * // DUNGEONMASTER_PORT env → config.dungeonmaster.port walked up from startDir → environmentStatics.defaultPort
 */

import { getEnv } from '#gateway/node/process';
import { environmentStatics } from '../../../statics/environment/environment-statics';
import { portConfigWalkBroker } from '../config-walk/port-config-walk-broker';

export const portResolveBroker = ({ startDir }: { startDir: string }): number => {
  const envPort = getEnv('DUNGEONMASTER_PORT');
  if (envPort !== undefined && envPort !== '') {
    const parsed = Number(envPort);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const configPort = portConfigWalkBroker({ dir: startDir });
  if (configPort !== undefined) {
    return configPort;
  }

  return environmentStatics.defaultPort;
};
