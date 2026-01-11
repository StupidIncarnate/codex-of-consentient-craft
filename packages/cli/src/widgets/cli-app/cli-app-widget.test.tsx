import React from 'react';

import { InstallContextStub } from '@dungeonmaster/shared/contracts';

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
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
  });

  describe('screen routing', () => {
    it('VALID: {initialScreen: menu} => renders menu screen', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="menu"
            onSpawnChaoswhisperer={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/dungeonmaster/u);
      expect(lastFrame()).toMatch(/> Add/u);
    });

    it('VALID: {initialScreen: help} => renders help screen', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="help"
            onSpawnChaoswhisperer={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Available Commands/u);
    });

    it('VALID: {initialScreen: list} => renders list screen', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="list"
            onSpawnChaoswhisperer={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Active Quests/u);
    });

    it('VALID: {initialScreen: init} => renders init screen', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="init"
            onSpawnChaoswhisperer={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Initialize Dungeonmaster/u);
    });

    it('VALID: {initialScreen: add} => renders add screen with text input', () => {
      CliAppWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="add"
            onSpawnChaoswhisperer={noopCallback}
            onExit={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/What would you like to build/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onSpawnChaoswhisperer, onExit callbacks} => accepts callbacks', () => {
      CliAppWidgetProxy();
      const onSpawnChaoswhisperer = (): void => {
        // Callback exists
      };
      const onExit = (): void => {
        // Callback exists
      };

      const { unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <CliAppWidget
            initialScreen="menu"
            onSpawnChaoswhisperer={onSpawnChaoswhisperer}
            onExit={onExit}
            installContext={createMockInstallContext()}
          />
        ),
      });
      unmountFn = unmount;

      expect(onSpawnChaoswhisperer).toBeDefined();
      expect(onExit).toBeDefined();
    });
  });
});
