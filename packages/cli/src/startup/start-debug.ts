#!/usr/bin/env node

/**
 * PURPOSE: Entry point for CLI debug mode that handles JSON line protocol communication
 *
 * USAGE:
 * await StartDebug();
 * // Reads JSON commands from stdin, processes them, outputs JSON responses to stdout
 */

import { createInterface } from 'readline';
import { resolve } from 'path';
import React from 'react';

import { filePathContract, errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { InstallContext, Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { inkTestingLibraryRenderAdapter } from '../adapters/ink-testing-library/render/ink-testing-library-render-adapter';
import { fsRealpathAdapter } from '../adapters/fs/realpath/fs-realpath-adapter';
import { debugCommandContract } from '../contracts/debug-command/debug-command-contract';
import type { DebugCommand } from '../contracts/debug-command/debug-command-contract';
import { cliAppScreenContract } from '../contracts/cli-app-screen/cli-app-screen-contract';
import { terminalFrameContract } from '../contracts/terminal-frame/terminal-frame-contract';
import type { DebugSessionState } from '../contracts/debug-session-state/debug-session-state-contract';
import type { DebugSessionCallbackInvocations } from '../contracts/debug-session-callback-invocations/debug-session-callback-invocations-contract';
import type { RenderCapabilities } from '../contracts/render-capabilities/render-capabilities-contract';
import { debugSessionBroker } from '../brokers/debug/session/debug-session-broker';
import { buildDebugResponseTransformer } from '../transformers/build-debug-response/build-debug-response-transformer';
import { waitForRenderTransformer } from '../transformers/wait-for-render/wait-for-render-transformer';
import { debugKeysStatics } from '../statics/debug-keys/debug-keys-statics';
import { CliAppWidget } from '../widgets/cli-app/cli-app-widget';

type QuestFolder = Quest['folder'];
type InkRenderResult = ReturnType<typeof inkTestingLibraryRenderAdapter>;

export const StartDebug = async (): Promise<void> => {
  const dungeonmasterRoot = filePathContract.parse(resolve(__dirname, '../../../..'));
  const targetProjectRoot = filePathContract.parse(process.cwd());
  const installContext: InstallContext = { dungeonmasterRoot, targetProjectRoot };

  const { state, invocations } = debugSessionBroker({
    initialScreen: cliAppScreenContract.parse('menu'),
  });

  const context: {
    state: DebugSessionState;
    invocations: DebugSessionCallbackInvocations;
    renderResult: InkRenderResult | undefined;
    renderCapabilities: RenderCapabilities | undefined;
  } = {
    state,
    invocations,
    renderResult: undefined,
    renderCapabilities: undefined,
  };

  const readlineInterface = createInterface({
    input: process.stdin,
    terminal: false,
  });

  readlineInterface.on('line', (line) => {
    const parseResult = debugCommandContract.safeParse(JSON.parse(line) as unknown);
    if (!parseResult.success) {
      const frame = terminalFrameContract.parse('');
      const errorMsg = errorMessageContract.parse('Invalid JSON command');
      const response = buildDebugResponseTransformer({
        success: false,
        error: errorMsg,
        frame,
        currentScreen: context.state.currentScreen,
        invocations: context.invocations,
      });
      process.stdout.write(`${JSON.stringify(response)}\n`);
      return;
    }

    const command: DebugCommand = parseResult.data;

    if (command.action === 'start') {
      context.state.currentScreen = command.screen;
      context.invocations = {
        onRunQuest: [],
        onExit: [],
      };

      const renderResult = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: command.screen,
          installContext,
          onRunQuest: ({
            questId,
            questFolder,
          }: {
            questId: QuestId;
            questFolder: QuestFolder;
          }) => {
            context.invocations.onRunQuest.push({ questId, questFolder });
          },
          onExit: () => {
            context.invocations.onExit.push({} as Record<PropertyKey, never>);
          },
        }),
      });

      context.renderResult = renderResult;
      context.renderCapabilities = {
        writeStdin: (text: string) => {
          renderResult.stdin.write(text);
          return true;
        },
        getFrame: () => terminalFrameContract.parse(renderResult.lastFrame() ?? ''),
        unmount: () => {
          renderResult.unmount();
        },
      };
    }

    if (context.state.isExited) {
      const frame = terminalFrameContract.parse('');
      const errorMsg = errorMessageContract.parse('Session already exited');
      const response = buildDebugResponseTransformer({
        success: false,
        error: errorMsg,
        frame,
        currentScreen: context.state.currentScreen,
        invocations: context.invocations,
      });
      process.stdout.write(`${JSON.stringify(response)}\n`);
      return;
    }

    const capabilities = context.renderCapabilities;
    if (capabilities === undefined) {
      const frame = terminalFrameContract.parse('');
      const errorMsg = errorMessageContract.parse(
        'No active render session - send start command first',
      );
      const response = buildDebugResponseTransformer({
        success: false,
        error: errorMsg,
        frame,
        currentScreen: context.state.currentScreen,
        invocations: context.invocations,
      });
      process.stdout.write(`${JSON.stringify(response)}\n`);
      return;
    }

    waitForRenderTransformer()
      .then(async () => {
        const frame = capabilities.getFrame();

        if (command.action === 'start') {
          const response = buildDebugResponseTransformer({
            success: true,
            frame,
            currentScreen: context.state.currentScreen,
            invocations: context.invocations,
          });
          process.stdout.write(`${JSON.stringify(response)}\n`);
          return undefined;
        }

        if (command.action === 'input') {
          capabilities.writeStdin(command.text);
          await waitForRenderTransformer();
          const updatedFrame = capabilities.getFrame();
          const response = buildDebugResponseTransformer({
            success: true,
            frame: updatedFrame,
            currentScreen: context.state.currentScreen,
            invocations: context.invocations,
          });
          process.stdout.write(`${JSON.stringify(response)}\n`);
          return undefined;
        }

        if (command.action === 'keypress') {
          const keyCode =
            debugKeysStatics.codes[command.key as keyof typeof debugKeysStatics.codes];
          capabilities.writeStdin(keyCode);
          await waitForRenderTransformer();
          const updatedFrame = capabilities.getFrame();
          const response = buildDebugResponseTransformer({
            success: true,
            frame: updatedFrame,
            currentScreen: context.state.currentScreen,
            invocations: context.invocations,
          });
          process.stdout.write(`${JSON.stringify(response)}\n`);
          return undefined;
        }

        if (command.action === 'getScreen') {
          const response = buildDebugResponseTransformer({
            success: true,
            frame,
            currentScreen: context.state.currentScreen,
            invocations: context.invocations,
          });
          process.stdout.write(`${JSON.stringify(response)}\n`);
          return undefined;
        }

        // exit command
        capabilities.unmount();
        context.state.isExited = true;
        const exitFrame = terminalFrameContract.parse('');
        const response = buildDebugResponseTransformer({
          success: true,
          frame: exitFrame,
          currentScreen: context.state.currentScreen,
          invocations: context.invocations,
        });
        process.stdout.write(`${JSON.stringify(response)}\n`);
        readlineInterface.close();
        return undefined;
      })
      .catch((caughtError: unknown) => {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : String(caughtError);
        const frame = terminalFrameContract.parse('');
        const response = buildDebugResponseTransformer({
          success: false,
          error: errorMessageContract.parse(errorMessage),
          frame,
          currentScreen: context.state.currentScreen,
          invocations: context.invocations,
        });
        process.stdout.write(`${JSON.stringify(response)}\n`);
      });
  });

  await new Promise<void>((promiseResolve) => {
    readlineInterface.on('close', () => {
      promiseResolve();
    });
  });
};

const isMain =
  process.argv[1] !== undefined &&
  fsRealpathAdapter({ filePath: absoluteFilePathContract.parse(process.argv[1]) }) ===
    fsRealpathAdapter({ filePath: absoluteFilePathContract.parse(__filename) });

if (isMain) {
  StartDebug().catch((caughtError: unknown) => {
    const errorMessage = caughtError instanceof Error ? caughtError.message : String(caughtError);
    process.stderr.write(`Error: ${errorMessage}\n`);
    process.exit(1);
  });
}
