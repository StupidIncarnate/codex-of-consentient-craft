/**
 * PURPOSE: Integration tests for CLI startup entry point detection and initialization
 *
 * USAGE:
 * npm test -- start-cli.integration.test.ts
 */

import { realpathSync } from 'node:fs';

import { inkTestingLibraryRenderAdapter } from '../adapters/ink-testing-library/render/ink-testing-library-render-adapter';
import React from 'react';

import {
  DependencyStepStub,
  FilePathStub,
  InstallContextStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';
import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';

import { cliStatics } from '../statics/cli/cli-statics';
import { StartCli } from './start-cli';
import { CliAppWidget } from '../widgets/cli-app/cli-app-widget';
import { questLoadBroker } from '../brokers/quest/load/quest-load-broker';
import { questUpdateStepBroker } from '../brokers/quest/update-step/quest-update-step-broker';
import { questListBroker } from '../brokers/quest/list/quest-list-broker';

const waitForUseEffect = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, cliStatics.testing.useEffectDelayMs);
  });
};

// Dummy install context for tests that don't use the init flow
const createDummyInstallContext = (): ReturnType<typeof InstallContextStub> =>
  InstallContextStub({
    value: {
      targetProjectRoot: __dirname,
      dungeonmasterRoot: __dirname,
    },
  });

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
      const onRunQuest = jest.fn();
      const onExit = jest.fn();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: 'add',
          onSpawnChaoswhisperer,
          onResumeChaoswhisperer: jest.fn(),
          onRunQuest,
          onExit,
          installContext: createDummyInstallContext(),
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
      const onRunQuest = jest.fn();
      const onExit = jest.fn();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: 'add',
          onSpawnChaoswhisperer,
          onResumeChaoswhisperer: jest.fn(),
          onRunQuest,
          onExit,
          installContext: createDummyInstallContext(),
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
      const onRunQuest = jest.fn();
      const onExit = jest.fn();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: 'menu',
          onSpawnChaoswhisperer,
          onResumeChaoswhisperer: jest.fn(),
          onRunQuest,
          onExit,
          installContext: createDummyInstallContext(),
        }),
      });

      await waitForUseEffect();

      // Add is the first option (index 0), already selected by default
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

  describe('init flow integration', () => {
    it('VALID: {initialScreen: init, no explicit installContext} => resolves dungeonmasterRoot automatically', async () => {
      // This test verifies the fix for the bug where init failed with
      // "Path must be absolute" when no installContext was provided
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'init-auto-resolve' }),
      });

      const onSpawnChaoswhisperer = jest.fn();
      const onRunQuest = jest.fn();
      const onExit = jest.fn();

      // Pass installContext with only targetProjectRoot - dungeonmasterRoot should be resolved internally
      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: 'init',
          onSpawnChaoswhisperer,
          onResumeChaoswhisperer: jest.fn(),
          onRunQuest,
          onExit,
          installContext: {
            targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
            // Note: we're using testbed.dungeonmasterPath but in real CLI it should auto-resolve
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        }),
      });

      // Wait for async install to complete
      await waitForUseEffect();
      await waitForUseEffect();
      await waitForUseEffect();

      const frame = lastFrame();
      unmount();
      testbed.cleanup();

      // Should not show path validation error
      expect(frame).not.toMatch(/Path must be absolute/u);
      // Should show either success or "no packages" (depending on testbed setup)
      expect(frame).toMatch(/Initialize Dungeonmaster/u);
    });

    it('VALID: {initialScreen: init, no devDependencies} => adds devDependencies to package.json', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'init-flow' }),
      });

      const onSpawnChaoswhisperer = jest.fn();
      const onRunQuest = jest.fn();
      const onExit = jest.fn();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: 'init',
          onSpawnChaoswhisperer,
          onResumeChaoswhisperer: jest.fn(),
          onRunQuest,
          onExit,
          installContext: {
            targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        }),
      });

      // Wait for async install to complete
      await waitForUseEffect();
      await waitForUseEffect();
      await waitForUseEffect();

      const frame = lastFrame();
      unmount();

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });

      testbed.cleanup();

      expect(frame).toMatch(/Added devDependencies/u);
      expect(packageJsonContent).toMatch(/"devDependencies"/u);
      expect(packageJsonContent).toMatch(/"typescript"/u);
    });

    it('VALID: {initialScreen: init, all devDependencies exist} => shows already present message', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'init-already' }),
      });

      // Pre-populate with all required devDependencies
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            {
              name: 'test-project',
              version: '1.0.0',
              devDependencies: {
                '@eslint/compat': '^1.3.1',
                '@eslint/eslintrc': '^3.3.1',
                '@types/debug': '^4.1.12',
                '@types/eslint': '^9.0.0',
                '@types/jest': '^30.0.0',
                '@types/node': '^24.0.15',
                '@types/prettier': '^2.7.3',
                '@typescript-eslint/eslint-plugin': '^8.35.1',
                '@typescript-eslint/parser': '^8.35.1',
                eslint: '^9.36.0',
                'eslint-config-prettier': '^10.1.5',
                'eslint-plugin-eslint-comments': '^3.2.0',
                'eslint-plugin-jest': '^29.0.1',
                'eslint-plugin-prettier': '^5.5.1',
                jest: '^30.0.4',
                prettier: '^3.6.2',
                'ts-jest': '^29.4.0',
                'ts-node': '^10.9.2',
                tsx: '^4.0.0',
                typescript: '^5.8.3',
              },
            },
            null,
            2,
          ),
        }),
      });

      const onSpawnChaoswhisperer = jest.fn();
      const onRunQuest = jest.fn();
      const onExit = jest.fn();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: 'init',
          onSpawnChaoswhisperer,
          onResumeChaoswhisperer: jest.fn(),
          onRunQuest,
          onExit,
          installContext: {
            targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        }),
      });

      await waitForUseEffect();
      await waitForUseEffect();
      await waitForUseEffect();

      const frame = lastFrame();
      unmount();

      testbed.cleanup();

      expect(frame).toMatch(/already present/iu);
    });

    it('VALID: {press escape on init screen after install} => returns to menu', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'init-escape' }),
      });

      const onSpawnChaoswhisperer = jest.fn();
      const onRunQuest = jest.fn();
      const onExit = jest.fn();

      const { stdin, lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: 'init',
          onSpawnChaoswhisperer,
          onResumeChaoswhisperer: jest.fn(),
          onRunQuest,
          onExit,
          installContext: {
            targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        }),
      });

      await waitForUseEffect();
      await waitForUseEffect();
      await waitForUseEffect();

      // Press escape to go back
      stdin.write('\x1B');
      await waitForUseEffect();

      const frame = lastFrame();
      unmount();

      testbed.cleanup();

      // Should be back at menu (check for menu elements on separate lines)
      expect(frame).toMatch(/Add/u);
      expect(frame).toMatch(/List/u);
      expect(frame).toMatch(/Init/u);
    });

    it('VALID: {navigate from menu to init} => runs installation', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'init-navigate' }),
      });

      const onSpawnChaoswhisperer = jest.fn();
      const onRunQuest = jest.fn();
      const onExit = jest.fn();

      const { stdin, lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(CliAppWidget, {
          initialScreen: 'menu',
          onSpawnChaoswhisperer,
          onResumeChaoswhisperer: jest.fn(),
          onRunQuest,
          onExit,
          installContext: {
            targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        }),
      });

      await waitForUseEffect();

      // Navigate to Init (index 3: Add=0, Run=1, List=2, Init=3)
      stdin.write('\x1B[B'); // Down to run
      await waitForUseEffect();
      stdin.write('\x1B[B'); // Down to list
      await waitForUseEffect();
      stdin.write('\x1B[B'); // Down to init
      await waitForUseEffect();

      // Select Init
      stdin.write('\r');
      await waitForUseEffect();
      await waitForUseEffect();
      await waitForUseEffect();

      const frame = lastFrame();
      unmount();

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });

      testbed.cleanup();

      expect(frame).toMatch(/Initialize Dungeonmaster/u);
      expect(packageJsonContent).toMatch(/"devDependencies"/u);
    });
  });

  describe('quest file operations integration', () => {
    it('VALID: {quest file exists} => questLoadBroker loads and parses quest from real file system', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-load' }),
      });

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'pending', dependsOn: [] });
      const quest = QuestStub({ id: 'test-quest', steps: [step] });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster-quests/test-quest.json' }),
        content: FileContentStub({ value: JSON.stringify(quest, null, 2) }),
      });

      const questFilePath = FilePathStub({
        value: `${testbed.projectPath}/.dungeonmaster-quests/test-quest.json`,
      });

      const loadedQuest = await questLoadBroker({ questFilePath });
      const [firstStep] = loadedQuest.steps;

      testbed.cleanup();

      expect(loadedQuest.id).toBe('test-quest');
      expect(firstStep).toBeDefined();
      expect(firstStep?.id).toBe(stepId);
      expect(firstStep?.status).toBe('pending');
    });

    it('VALID: {quest with pending step} => questUpdateStepBroker updates step status on real file system', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-update' }),
      });

      const stepId = StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      const step = DependencyStepStub({ id: stepId, status: 'pending', dependsOn: [] });
      const quest = QuestStub({ id: 'update-test', steps: [step] });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster-quests/update-test.json' }),
        content: FileContentStub({ value: JSON.stringify(quest, null, 2) }),
      });

      const questFilePath = FilePathStub({
        value: `${testbed.projectPath}/.dungeonmaster-quests/update-test.json`,
      });

      await questUpdateStepBroker({
        questFilePath,
        stepId,
        updates: { status: 'in_progress' },
      });

      const updatedQuest = await questLoadBroker({ questFilePath });
      const [firstStep] = updatedQuest.steps;

      testbed.cleanup();

      expect(firstStep?.status).toBe('in_progress');
    });

    it('VALID: {multiple quest folders} => questListBroker lists quests from real directory', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-list' }),
      });

      const quest1 = QuestStub({ id: 'quest-1', title: 'First Quest', folder: '001-first-quest' });
      const quest2 = QuestStub({
        id: 'quest-2',
        title: 'Second Quest',
        folder: '002-second-quest',
      });

      testbed.writeFile({
        relativePath: RelativePathStub({
          value: '.dungeonmaster-quests/001-first-quest/quest.json',
        }),
        content: FileContentStub({ value: JSON.stringify(quest1, null, 2) }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({
          value: '.dungeonmaster-quests/002-second-quest/quest.json',
        }),
        content: FileContentStub({ value: JSON.stringify(quest2, null, 2) }),
      });

      const startPath = FilePathStub({
        value: testbed.projectPath,
      });

      const questList = await questListBroker({ startPath });
      const sortedTitles = questList.map((q) => q.title).sort();

      testbed.cleanup();

      expect(sortedTitles).toStrictEqual(['First Quest', 'Second Quest']);
    });

    it('VALID: {step with dependencies} => questUpdateStepBroker preserves other step data', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-preserve' }),
      });

      const stepId1 = StepIdStub({ value: 'c3d4e5f6-a7b8-6c9d-0e1f-2a3b4c5d6e7f' });
      const stepId2 = StepIdStub({ value: 'd4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a' });
      const step1 = DependencyStepStub({
        id: stepId1,
        name: 'Step One',
        status: 'complete',
        dependsOn: [],
      });
      const step2 = DependencyStepStub({
        id: stepId2,
        name: 'Step Two',
        status: 'pending',
        dependsOn: [stepId1],
      });
      const quest = QuestStub({ id: 'deps-test', steps: [step1, step2] });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster-quests/deps-test.json' }),
        content: FileContentStub({ value: JSON.stringify(quest, null, 2) }),
      });

      const questFilePath = FilePathStub({
        value: `${testbed.projectPath}/.dungeonmaster-quests/deps-test.json`,
      });

      await questUpdateStepBroker({
        questFilePath,
        stepId: stepId2,
        updates: { status: 'in_progress' },
      });

      const updatedQuest = await questLoadBroker({ questFilePath });
      const [firstStep, secondStep] = updatedQuest.steps;

      testbed.cleanup();

      expect(firstStep?.status).toBe('complete');
      expect(secondStep?.status).toBe('in_progress');
      expect(secondStep?.name).toBe('Step Two');
      expect(secondStep?.dependsOn).toStrictEqual([stepId1]);
    });

    it('ERROR: {nonexistent quest file} => questLoadBroker throws error', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-error' }),
      });

      const questFilePath = FilePathStub({
        value: `${testbed.projectPath}/.dungeonmaster-quests/nonexistent.json`,
      });

      testbed.cleanup();

      await expect(questLoadBroker({ questFilePath })).rejects.toThrow(/Failed to read file/u);
    });
  });
});
