/**
 * PURPOSE: Resolves the dungeonmaster server port — env var, then .dungeonmaster.json config walked up from cwd, then default
 *
 * USAGE:
 * const port = portResolveBroker();
 * // DUNGEONMASTER_PORT env → config.dungeonmaster.port → environmentStatics.defaultPort
 *
 * const port = portResolveBroker({ startDir: '/path/to/project' });
 * // Same ladder, walks up from startDir instead of process.cwd()
 */

import { cwd, getEnv } from '#gateway/node/process';
import { environmentStatics } from '../../../statics/environment/environment-statics';
import { portConfigWalkBroker } from '../config-walk/port-config-walk-broker';

export const portResolveBroker = ({
  startDir,
}: {
  startDir?: string;
} = {}): number => {
  const envPort = getEnv('DUNGEONMASTER_PORT');
  if (envPort !== undefined && envPort !== '') {
    const parsed = Number(envPort);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const lookupDir = startDir ?? cwd();
  const configPort = portConfigWalkBroker({ dir: lookupDir });
  if (configPort !== undefined) {
    return configPort;
  }

  return environmentStatics.defaultPort;
};
