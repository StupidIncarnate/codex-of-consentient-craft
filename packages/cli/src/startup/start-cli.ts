#!/usr/bin/env node

/**
 * PURPOSE: CLI entry point for init command and server launcher
 *
 * USAGE:
 * dungeonmaster init  // Runs install across all packages
 * dungeonmaster       // Launches HTTP server and opens browser
 */

import { exec } from 'child_process';
import { resolve } from 'path';

import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import { fsRealpathAdapter } from '../adapters/fs/realpath/fs-realpath-adapter';
import { installRunBroker } from '../brokers/install/run/install-run-broker';

const COMMAND_ARG_START_INDEX = 2;

const COMMANDS = {
  init: 'init',
  serve: 'serve',
} as const;

const SERVER_MODULE_NAME = '@dungeonmaster/server';

export const StartCli = async ({ command }: { command: string | undefined }): Promise<void> => {
  if (command === COMMANDS.init) {
    const dungeonmasterRoot = filePathContract.parse(resolve(__dirname, '../../../..'));
    const targetProjectRoot = filePathContract.parse(process.cwd());

    const results = await installRunBroker({
      context: { dungeonmasterRoot, targetProjectRoot },
    });

    for (const result of results) {
      const status = result.success ? 'OK' : 'FAIL';
      process.stdout.write(`[${status}] ${result.packageName}: ${result.message}\n`);
    }

    return;
  }

  // Default: launch HTTP server and open browser
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
  exec(cmd);
};

const isMain =
  process.argv[1] !== undefined &&
  fsRealpathAdapter({ filePath: absoluteFilePathContract.parse(process.argv[1]) }) ===
    fsRealpathAdapter({ filePath: absoluteFilePathContract.parse(__filename) });

if (isMain) {
  const [command] = process.argv.slice(COMMAND_ARG_START_INDEX);

  StartCli({ command }).catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${errorMessage}\n`);
    process.exit(1);
  });
}
