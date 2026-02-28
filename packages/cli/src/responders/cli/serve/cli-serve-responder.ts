/**
 * PURPOSE: Launches the Dungeonmaster HTTP server and opens the web UI in the default browser
 *
 * USAGE:
 * await CliServeResponder();
 * // Starts server module, writes URL to stdout, opens browser with platform-appropriate command
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import { childProcessExecAdapter } from '../../../adapters/child-process/exec/child-process-exec-adapter';

const SERVER_MODULE_NAME = '@dungeonmaster/server';

export const CliServeResponder = async (): Promise<void> => {
  const serverPath = filePathContract.parse(require.resolve(SERVER_MODULE_NAME));
  const serverModule = await runtimeDynamicImportAdapter<{ StartServer: () => void }>({
    path: serverPath,
  });

  serverModule.StartServer();
  const port = Number(process.env.DUNGEONMASTER_PORT) || environmentStatics.defaultPort;
  const serverUrl = `http://${environmentStatics.hostname}:${port}`;
  process.stdout.write(`Dungeonmaster server running at ${serverUrl}\n`);

  const cmd =
    process.platform === 'darwin'
      ? `open ${serverUrl}`
      : process.platform === 'win32'
        ? `start ${serverUrl}`
        : `xdg-open ${serverUrl}`;
  childProcessExecAdapter({ command: cmd });
};
