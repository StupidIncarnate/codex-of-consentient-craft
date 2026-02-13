import React from 'react';

import { InstallContextStub, ProjectIdStub } from '@dungeonmaster/shared/contracts';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import { CliAppWidget } from './cli-app-widget';
import { CliAppWidgetProxy } from './cli-app-widget.proxy';

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

describe('CliAppWidget', () => {
  describe('screen routing', () => {
    it('VALID: {initialScreen: menu} => renders menu screen', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="menu"
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
            projectId={ProjectIdStub()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/dungeonmaster/u);
      expect(frame).toMatch(/> Run/u);
    });

    it('VALID: {initialScreen: help} => renders help screen', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="help"
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
            projectId={ProjectIdStub()}
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
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
            projectId={ProjectIdStub()}
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
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
            projectId={ProjectIdStub()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Initialize Dungeonmaster/u);
    });

    it('VALID: {initialScreen: run} => renders run screen with quest selection', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="run"
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
            projectId={ProjectIdStub()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Run Quest/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {menu screen} => renders with all callback props without error', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="menu"
            onRunQuest={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
            projectId={ProjectIdStub()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      // Widget renders successfully with all props
      expect(frame).toMatch(/dungeonmaster/u);
    });
  });
});
