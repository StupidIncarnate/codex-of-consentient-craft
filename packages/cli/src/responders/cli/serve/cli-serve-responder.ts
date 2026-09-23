/**
 * PURPOSE: Launches the Dungeonmaster HTTP server and opens the web UI in the default browser
 *
 * USAGE:
 * await CliServeResponder();
 * // Starts server module, writes URL to stdout, opens browser with platform-appropriate command
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract, filePathContract } from '@dungeonmaster/shared/contracts';
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import { portResolveBroker } from '@dungeonmaster/shared/brokers';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import { childProcessExecAdapter } from '../../../adapters/child-process/exec/child-process-exec-adapter';
import { httpBackendPackageResolveBroker } from '../../../brokers/http-backend-package/resolve/http-backend-package-resolve-broker';

export const CliServeResponder = async (): Promise<AdapterResult> => {
  const serverPackageName = await httpBackendPackageResolveBroker();
  const serverPath = filePathContract.parse(require.resolve(serverPackageName));
  const serverModule = await runtimeDynamicImportAdapter<{
    StartServer: (args?: { serveWebBundle?: boolean }) => AdapterResult;
  }>({
    path: serverPath,
  });

  // Published single-port launch: no separate vite server exists, so the HTTP server serves the
  // built @dungeonmaster/web bundle itself for non-API routes.
  serverModule.StartServer({ serveWebBundle: true });
  const port = Number(portResolveBroker());
  const serverUrl = `http://${environmentStatics.hostname}:${port}`;
  process.stdout.write(`Dungeonmaster server running at ${serverUrl}\n`);

  const cmd =
    process.platform === 'darwin'
      ? `open ${serverUrl}`
      : process.platform === 'win32'
        ? `start ${serverUrl}`
        : `xdg-open ${serverUrl}`;
  childProcessExecAdapter({ command: cmd });
  return adapterResultContract.parse({ success: true });
};
