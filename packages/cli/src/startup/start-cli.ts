#!/usr/bin/env node

/**
 * PURPOSE: CLI entry point with interactive Ink menu and ChaosWhisperer spawning loop
 *
 * USAGE:
 * await StartCli();
 * // Renders interactive menu, spawns ChaosWhisperer on 'add', returns to list after signal
 */

import { resolve } from 'path';
import { render } from 'ink';
import React from 'react';

import { questsFolderFindBroker } from '@dungeonmaster/shared/brokers';
import type { UserInput, InstallContext } from '@dungeonmaster/shared/contracts';
import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';

import { fsRealpathAdapter } from '../adapters/fs/realpath/fs-realpath-adapter';

import { chaoswhispererSpawnSubprocessBroker } from '../brokers/chaoswhisperer/spawn-subprocess/chaoswhisperer-spawn-subprocess-broker';
import { signalCleanupBroker } from '../brokers/signal/cleanup/signal-cleanup-broker';
import { signalWatchBroker } from '../brokers/signal/watch/signal-watch-broker';
import type { CliAppScreen } from '../widgets/cli-app/cli-app-widget';
import { CliAppWidget } from '../widgets/cli-app/cli-app-widget';

export const StartCli = async ({
  initialScreen = 'menu' as CliAppScreen,
}: {
  initialScreen?: CliAppScreen;
} = {}): Promise<void> => {
  // State object to capture results from Ink callbacks (object reference stays constant)
  const state: { pendingChaoswhisperer: UserInput | null; shouldExit: boolean } = {
    pendingChaoswhisperer: null,
    shouldExit: false,
  };

  // Compute install context for init flow
  // dungeonmasterRoot is 4 levels up from startup/ (startup -> src -> cli -> packages -> root)
  const dungeonmasterRoot = filePathContract.parse(resolve(__dirname, '../../../..'));
  const targetProjectRoot = filePathContract.parse(process.cwd());
  const installContext: InstallContext = { dungeonmasterRoot, targetProjectRoot };

  // Render the Ink app
  const { unmount, waitUntilExit } = render(
    React.createElement(CliAppWidget, {
      initialScreen,
      installContext,
      onSpawnChaoswhisperer: ({ userInput }: { userInput: UserInput }) => {
        state.pendingChaoswhisperer = userInput;
        unmount();
      },
      onExit: () => {
        state.shouldExit = true;
        unmount();
      },
    }),
  );

  await waitUntilExit();

  // Exit if user requested
  if (state.shouldExit) {
    return;
  }

  // No ChaosWhisperer pending, restart at menu
  if (state.pendingChaoswhisperer === null) {
    return StartCli({ initialScreen: 'menu' });
  }

  // Handle ChaosWhisperer spawn
  // Find quests folder path
  const questsFolderPath = await questsFolderFindBroker({
    startPath: filePathContract.parse(process.cwd()),
  });

  // Clean up any existing signal file
  await signalCleanupBroker({ questsFolderPath });

  // Spawn ChaosWhisperer subprocess (returns handle for later kill)
  const subprocess = chaoswhispererSpawnSubprocessBroker({
    userInput: state.pendingChaoswhisperer,
  });

  // Watch for signal file (MCP tool writes this when ChaosWhisperer is done)
  const signal = await signalWatchBroker({ questsFolderPath });

  // Kill subprocess when signal received and wait for full exit before rendering Ink
  subprocess.kill();
  await subprocess.waitForExit();

  // Clear terminal and scrollback before rendering Ink to remove subprocess output
  process.stdout.write('\x1B[2J\x1B[3J\x1B[H');

  // Determine next screen based on signal type and recurse
  // Return signals have 'action' and 'screen', quest signals have 'type'
  const nextScreen: CliAppScreen =
    'action' in signal ? signal.screen : signal.type === 'agent-ready' ? 'menu' : 'list';

  // Continue application loop with next screen
  return StartCli({ initialScreen: nextScreen });
};

const isMain =
  process.argv[1] !== undefined &&
  fsRealpathAdapter({ filePath: absoluteFilePathContract.parse(process.argv[1]) }) ===
    fsRealpathAdapter({ filePath: absoluteFilePathContract.parse(__filename) });

if (isMain) {
  StartCli().catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${errorMessage}\n`);
    process.exit(1);
  });
}
