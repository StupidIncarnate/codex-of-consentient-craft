/**
 * PURPOSE: Installs dependencies and spawns a Vite dev server in a design scaffold directory
 *
 * USAGE:
 * const { kill } = await designStartBroker({ designPath, port });
 * // Runs npm install, spawns npx vite, returns kill function
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath, Quest } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnLongLivedAdapter } from '../../../adapters/child-process/spawn-long-lived/child-process-spawn-long-lived-adapter';

type DesignPort = NonNullable<Quest['designPort']>;

const EXIT_CODE_SUCCESS = 0;

export const designStartBroker = async ({
  designPath,
  port,
}: {
  designPath: AbsoluteFilePath;
  port: DesignPort;
}): Promise<{ kill: () => void }> => {
  const installResult = await childProcessSpawnCaptureAdapter({
    command: 'npm',
    args: ['install'],
    cwd: designPath,
  });

  if (installResult.exitCode !== EXIT_CODE_SUCCESS) {
    throw new Error(`npm install failed: ${String(installResult.output)}`);
  }

  const { kill } = childProcessSpawnLongLivedAdapter({
    command: 'npx',
    args: ['vite', '--port', String(port)],
    cwd: designPath,
  });

  return { kill };
};
