/**
 * PURPOSE: Launches the Dungeonmaster HTTP server and opens the web UI in the default browser
 *
 * USAGE:
 * await CliServeResponder();
 * // Starts server module, writes URL to stdout, opens browser with platform-appropriate command
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import { dynamicImport } from '#gateway/node/module';
import { runFireAndForget } from '#gateway/node/child_process';
import { getPlatform, stdout } from '#gateway/node/process';
import { portResolveBroker } from '@dungeonmaster/shared/brokers';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import { httpBackendPackageResolveBroker } from '../../../brokers/http-backend-package/resolve/http-backend-package-resolve-broker';
import { startServerModuleContract } from '../../../contracts/start-server-module/start-server-module-contract';

export const CliServeResponder = async (): Promise<void> => {
  const serverPackageName = await httpBackendPackageResolveBroker();
  const serverPath = filePathContract.parse(require.resolve(serverPackageName));
  const serverModule = startServerModuleContract.parse(await dynamicImport({ path: serverPath }));

  // Published single-port launch: no separate vite server exists, so the HTTP server serves the
  // built @dungeonmaster/web bundle itself for non-API routes.
  serverModule.StartServer({ serveWebBundle: true });
  const port = Number(portResolveBroker());
  const serverUrl = `http://${environmentStatics.hostname}:${port}`;
  stdout.write(`Dungeonmaster server running at ${serverUrl}\n`);

  const platform = getPlatform();
  const cmd =
    platform === 'darwin'
      ? `open ${serverUrl}`
      : platform === 'win32'
        ? `start ${serverUrl}`
        : `xdg-open ${serverUrl}`;
  runFireAndForget({ command: cmd });
};
