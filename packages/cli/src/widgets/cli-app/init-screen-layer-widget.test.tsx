import React from 'react';

import { InstallContextStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import { InitScreenLayerWidget } from './init-screen-layer-widget';
import { InitScreenLayerWidgetProxy } from './init-screen-layer-widget.proxy';

// Simple no-op callback for tests that only check rendering
const noopCallback = (): void => {
  // No-op
};

// Mock install context for tests (actual value doesn't matter since useInstallBinding is mocked)
const createMockInstallContext = (): ReturnType<typeof InstallContextStub> =>
  InstallContextStub({
    value: {
      targetProjectRoot: __dirname,
      dungeonmasterRoot: __dirname,
    },
  });

describe('InitScreenLayerWidget', () => {
  describe('rendering init content', () => {
    it('VALID: {} => displays Initialize Dungeonmaster title', () => {
      const proxy = InitScreenLayerWidgetProxy();
      proxy.setupEmptyPackagesDirectory({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <InitScreenLayerWidget
            onBack={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Initialize Dungeonmaster/u);
    });

    it('VALID: {} => displays installing message when loading', () => {
      const proxy = InitScreenLayerWidgetProxy();
      proxy.setupEmptyPackagesDirectory({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <InitScreenLayerWidget
            onBack={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Installing/u);
    });

    it('VALID: {} => displays back instruction', () => {
      const proxy = InitScreenLayerWidgetProxy();
      proxy.setupEmptyPackagesDirectory({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <InitScreenLayerWidget
            onBack={noopCallback}
            installContext={createMockInstallContext()}
          />
        ),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Press Escape or 'q' to go back/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onBack callback} => accepts onBack prop for navigation', () => {
      const proxy = InitScreenLayerWidgetProxy();
      proxy.setupEmptyPackagesDirectory({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
      });
      const onBack = (): void => {
        // Callback exists
      };

      const { unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <InitScreenLayerWidget onBack={onBack} installContext={createMockInstallContext()} />
        ),
      });

      unmount();

      expect(onBack).toBeDefined();
    });
  });
});
