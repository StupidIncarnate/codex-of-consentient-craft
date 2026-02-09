#!/usr/bin/env node

/**
 * PURPOSE: CLI entry point with interactive Ink menu
 *
 * USAGE:
 * await StartCli();
 * // Renders interactive menu
 */

import { resolve } from 'path';
import { render } from 'ink';
import React from 'react';

import type { InstallContext, Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';

import { fsRealpathAdapter } from '../adapters/fs/realpath/fs-realpath-adapter';

import type { CliAppScreen } from '../widgets/cli-app/cli-app-widget';
import { CliAppWidget } from '../widgets/cli-app/cli-app-widget';

type QuestFolder = Quest['folder'];

// ANSI escape sequence to clear screen and move cursor to top-left
const CLEAR_SCREEN = '\x1b[2J\x1b[H';

export const StartCli = async ({
  initialScreen = 'menu' as CliAppScreen,
}: {
  initialScreen?: CliAppScreen;
} = {}): Promise<void> => {
  // Clear screen before rendering ink UI
  process.stdout.write(CLEAR_SCREEN);

  // State object to capture results from Ink callbacks (object reference stays constant)
  const state: {
    pendingQuestExecution: { questId: QuestId; questFolder: QuestFolder } | null;
    shouldExit: boolean;
  } = {
    pendingQuestExecution: null,
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
      onRunQuest: ({ questId, questFolder }: { questId: QuestId; questFolder: QuestFolder }) => {
        state.pendingQuestExecution = { questId, questFolder };
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

  // Handle quest execution if pending - quest execution is handled by orchestrator package
  if (state.pendingQuestExecution !== null) {
    return StartCli({ initialScreen: 'menu' });
  }

  // No quest pending, restart at menu
  return StartCli({ initialScreen: 'menu' });
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
