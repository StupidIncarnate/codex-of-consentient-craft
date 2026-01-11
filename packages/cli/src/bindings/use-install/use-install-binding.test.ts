/**
 * PURPOSE: Tests for useInstallBinding hook
 */
import React from 'react';

import { InstallContextStub, InstallResultStub } from '@dungeonmaster/shared/contracts';

import { FileNameStub } from '../../contracts/file-name/file-name.stub';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';
import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';

import { useInstallBinding } from './use-install-binding';
import { useInstallBindingProxy } from './use-install-binding.proxy';

type InstallContext = ReturnType<typeof InstallContextStub>;

const ASYNC_WAIT_MS = 100;

/**
 * Test wrapper component that uses the hook and renders its state
 */
const TestHookWrapper = ({ context }: { context: InstallContext }): React.ReactElement => {
  const { data, loading, error } = useInstallBinding({ context });
  const Text = inkTextAdapter();

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Text, null, `loading:${String(loading)}`),
    React.createElement(Text, null, `dataLength:${data.length}`),
    React.createElement(Text, null, `error:${error ? error.message : 'null'}`),
    ...data.map((result, index) =>
      React.createElement(
        Text,
        { key: index },
        `result:${result.packageName}:${String(result.success)}`,
      ),
    ),
  );
};

describe('useInstallBinding', () => {
  describe('loading state', () => {
    it('VALID: {context} => returns loading true initially', () => {
      const { installRunProxy } = useInstallBindingProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      // Setup to return empty (no packages found)
      installRunProxy.packageDiscoverProxy.fsReaddirProxy.returns({
        files: [],
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(TestHookWrapper, { context }),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/loading:true/u);
    });
  });

  describe('successful install', () => {
    it('VALID: {context with packages} => returns results after loading', async () => {
      const { installRunProxy } = useInstallBindingProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      // Setup package discover to return packages
      installRunProxy.packageDiscoverProxy.fsReaddirProxy.returns({
        files: [FileNameStub({ value: 'mcp' })],
      });
      installRunProxy.packageDiscoverProxy.fsExistsSyncProxy.returns({ result: true });

      // Setup install execute to return success
      const successResult = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/mcp',
          success: true,
          action: 'created',
        },
      });

      const mockFn = jest.fn().mockResolvedValue(successResult);
      const module: Record<PropertyKey, unknown> = Object.create(null) as Record<
        PropertyKey,
        unknown
      >;
      module.StartInstall = mockFn;

      installRunProxy.installOrchestratProxy.installExecuteProxy.setupImport({ module });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(TestHookWrapper, { context }),
      });

      // Wait for async to complete
      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/loading:false/u);
      expect(frame).toMatch(/dataLength:1/u);
    });
  });

  describe('empty results', () => {
    it('VALID: {context with no packages} => returns empty array', async () => {
      const { installRunProxy } = useInstallBindingProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      // Setup package discover to return no packages
      installRunProxy.packageDiscoverProxy.fsReaddirProxy.returns({
        files: [],
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(TestHookWrapper, { context }),
      });

      // Wait for async to complete
      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/loading:false/u);
      expect(frame).toMatch(/dataLength:0/u);
      expect(frame).toMatch(/error:null/u);
    });
  });
});
