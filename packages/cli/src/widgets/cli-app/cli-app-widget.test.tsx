import React from 'react';

import { InstallContextStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';
import { SignalQuestionStub } from '../../contracts/signal-question/signal-question.stub';
import { SignalContextStub } from '../../contracts/signal-context/signal-context.stub';
import { cliStatics } from '../../statics/cli/cli-statics';

import { CliAppWidget } from './cli-app-widget';
import { CliAppWidgetProxy } from './cli-app-widget.proxy';

const waitForUseEffect = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, cliStatics.testing.useEffectDelayMs);
  });
};

// Simple no-op callback for tests that only check rendering
const noopCallback = (): void => {
  // No-op
};

// Mock install context for tests
const createMockInstallContext = (): ReturnType<typeof InstallContextStub> =>
  InstallContextStub({
    value: {
      targetProjectRoot: __dirname,
      dungeonmasterRoot: __dirname,
    },
  });

// Mock pending question for answer screen tests
const createMockPendingQuestion = (): {
  question: ReturnType<typeof SignalQuestionStub>;
  context: ReturnType<typeof SignalContextStub>;
  sessionId: ReturnType<typeof SessionIdStub>;
} => ({
  question: SignalQuestionStub({ value: 'What port number?' }),
  context: SignalContextStub({ value: 'Setting up server' }),
  sessionId: SessionIdStub({ value: 'test-session-123' }),
});

// Mock pending question with kill function for process cleanup tests
const createMockPendingQuestionWithKill = (): {
  question: ReturnType<typeof SignalQuestionStub>;
  context: ReturnType<typeof SignalContextStub>;
  sessionId: ReturnType<typeof SessionIdStub>;
  kill: jest.Mock;
} => ({
  question: SignalQuestionStub({ value: 'What port number?' }),
  context: SignalContextStub({ value: 'Setting up server' }),
  sessionId: SessionIdStub({ value: 'test-session-123' }),
  kill: jest.fn().mockReturnValue(true),
});

describe('CliAppWidget', () => {
  describe('screen routing', () => {
    it('VALID: {initialScreen: menu} => renders menu screen', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="menu"
            onSpawnChaoswhisperer={noopCallback}
            onResumeChaoswhisperer={noopCallback}
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/dungeonmaster/u);
      expect(frame).toMatch(/> Add/u);
    });

    it('VALID: {initialScreen: help} => renders help screen', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="help"
            onSpawnChaoswhisperer={noopCallback}
            onResumeChaoswhisperer={noopCallback}
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Available Commands/u);
    });

    it('VALID: {initialScreen: list} => renders list screen', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="list"
            onSpawnChaoswhisperer={noopCallback}
            onResumeChaoswhisperer={noopCallback}
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Quests/u);
    });

    it('VALID: {initialScreen: init} => renders init screen', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="init"
            onSpawnChaoswhisperer={noopCallback}
            onResumeChaoswhisperer={noopCallback}
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Initialize Dungeonmaster/u);
    });

    it('VALID: {initialScreen: add} => renders add screen with text input', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="add"
            onSpawnChaoswhisperer={noopCallback}
            onResumeChaoswhisperer={noopCallback}
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/What would you like to build/u);
    });

    it('VALID: {initialScreen: run} => renders run screen with quest selection', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="run"
            onSpawnChaoswhisperer={noopCallback}
            onResumeChaoswhisperer={noopCallback}
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Run Quest/u);
    });

    it('VALID: {initialScreen: answer, pendingQuestion} => renders answer screen', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="answer"
            onSpawnChaoswhisperer={noopCallback}
            onResumeChaoswhisperer={noopCallback}
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
            pendingQuestion={createMockPendingQuestion()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/What port number\?/u);
      expect(frame).toMatch(/Setting up server/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {menu screen} => renders with all callback props without error', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="menu"
            onSpawnChaoswhisperer={noopCallback}
            onResumeChaoswhisperer={noopCallback}
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      // Widget renders successfully with all props
      expect(frame).toMatch(/dungeonmaster/u);
    });
  });

  describe('process cleanup on cancel', () => {
    it('VALID: {answer screen with kill + escape} => calls kill function', async () => {
      CliAppWidgetProxy();
      const pendingQuestion = createMockPendingQuestionWithKill();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="answer"
            onSpawnChaoswhisperer={noopCallback}
            onResumeChaoswhisperer={noopCallback}
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
            pendingQuestion={pendingQuestion}
          />
        ),
      });

      await waitForUseEffect();
      stdin.write('\x1B'); // Escape key
      await waitForUseEffect();
      unmount();

      expect(pendingQuestion.kill).toHaveBeenCalledTimes(1);
    });

    it('VALID: {answer screen without kill + escape} => navigates to menu', async () => {
      CliAppWidgetProxy();

      const { stdin, lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="answer"
            onSpawnChaoswhisperer={noopCallback}
            onResumeChaoswhisperer={noopCallback}
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
            pendingQuestion={createMockPendingQuestion()}
          />
        ),
      });

      await waitForUseEffect();
      stdin.write('\x1B'); // Escape key
      await waitForUseEffect();

      const frame = lastFrame();
      unmount();

      // After escape, should show menu screen
      expect(frame).toMatch(/dungeonmaster/u);
    });
  });
});
