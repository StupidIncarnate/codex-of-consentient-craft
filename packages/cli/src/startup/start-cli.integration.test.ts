/**
 * PURPOSE: Integration tests for CLI startup entry point detection and initialization
 *
 * USAGE:
 * npm test -- start-cli.integration.test.ts
 */

import { realpathSync } from 'node:fs';

import { inkTestingLibraryRenderAdapter } from '../adapters/ink-testing-library/render/ink-testing-library-render-adapter';
import React from 'react';

import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { cliStatics } from '../statics/cli/cli-statics';
import { StartCli } from '../startup/start-cli';
import { CliAppWidget } from '../widgets/cli-app/cli-app-widget';

const waitForUseEffect = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, cliStatics.testing.useEffectDelayMs);
  });
};

type FilePath = ReturnType<typeof FilePathStub>;

const resolveRealPath = ({ path }: { path: FilePath }): FilePath => {
  try {
    return FilePathStub({ value: realpathSync(path) });
  } catch {
    return path;
  }
};

describe('StartCli', () => {
  describe('entry point detection', () => {
    it('VALID: {symlinked path} => resolves real path correctly', () => {
      const testPath = FilePathStub({ value: '/some/path/to/file.js' });

      // When path doesn't exist, it returns the original path
      expect(resolveRealPath({ path: testPath })).toBe(testPath);
    });

    it('VALID: {existing file} => resolves to real path', () => {
      const thisFile = FilePathStub({ value: __filename });

      // This file exists, so it should resolve
      const resolved = resolveRealPath({ path: thisFile });

      expect(resolved.length).toBeGreaterThan(0);
    });

    it('VALID: {__filename} => converts to file path', () => {
      const filePath = FilePathStub({ value: __filename });

      expect(filePath).toMatch(/start-cli\.integration\.test\.ts$/u);
    });
  });

  describe('module exports', () => {
    it('VALID: {} => exports StartCli function', () => {
      expect(typeof StartCli).toBe('function');
    });
  });

  describe('add flow integration', () => {
    it('VALID: start on add screen and submit => calls onSpawnChaoswhisperer', async () => {
      const onSpawnChaoswhisperer = jest.fn();
      const onExit = jest.fn();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: 'add',
          onSpawnChaoswhisperer,
          onExit,
        }),
      });

      await waitForUseEffect();

      // Type input
      stdin.write('Add user authentication');
      await waitForUseEffect();

      // Submit
      stdin.write('\r');
      await waitForUseEffect();

      unmount();

      expect(onSpawnChaoswhisperer).toHaveBeenCalledTimes(1);
      expect(onSpawnChaoswhisperer).toHaveBeenCalledWith({
        userInput: 'Add user authentication',
      });
    });

    it('VALID: add screen with backspace and submit => correctly edits input', async () => {
      const onSpawnChaoswhisperer = jest.fn();
      const onExit = jest.fn();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: 'add',
          onSpawnChaoswhisperer,
          onExit,
        }),
      });

      await waitForUseEffect();

      // Type input with extra chars
      stdin.write('Hello World!!');
      await waitForUseEffect();

      // Backspace twice to remove "!!"
      stdin.write('\x7F');
      await waitForUseEffect();
      stdin.write('\x7F');
      await waitForUseEffect();

      // Submit
      stdin.write('\r');
      await waitForUseEffect();

      unmount();

      expect(onSpawnChaoswhisperer).toHaveBeenCalledTimes(1);
      expect(onSpawnChaoswhisperer).toHaveBeenCalledWith({
        userInput: 'Hello World',
      });
    });

    it('VALID: navigate from menu to add and submit => full flow works', async () => {
      const onSpawnChaoswhisperer = jest.fn();
      const onExit = jest.fn();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: 'menu',
          onSpawnChaoswhisperer,
          onExit,
        }),
      });

      await waitForUseEffect();

      // Navigate to Add (4th option: Help, Init, List, Add)
      stdin.write('\x1B[B'); // Down
      await waitForUseEffect();
      stdin.write('\x1B[B'); // Down
      await waitForUseEffect();
      stdin.write('\x1B[B'); // Down
      await waitForUseEffect();

      // Select Add
      stdin.write('\r');
      await waitForUseEffect();

      // Type and submit
      stdin.write('Build API');
      await waitForUseEffect();
      stdin.write('\r');
      await waitForUseEffect();

      unmount();

      expect(onSpawnChaoswhisperer).toHaveBeenCalledTimes(1);
      expect(onSpawnChaoswhisperer).toHaveBeenCalledWith({
        userInput: 'Build API',
      });
    });
  });

  describe('spawn subprocess broker integration', () => {
    it('VALID: chaoswhispererSpawnSubprocessBroker => imports without ESM errors', async () => {
      // This test catches ESM issues like __dirname not defined
      const module = await import(
        '../brokers/chaoswhisperer/spawn-subprocess/chaoswhisperer-spawn-subprocess-broker'
      );

      expect(typeof module.chaoswhispererSpawnSubprocessBroker).toBe('function');
    });
  });
});
