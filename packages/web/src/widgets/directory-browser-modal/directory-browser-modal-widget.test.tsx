import { screen, waitFor } from '@testing-library/react';

import { DirectoryEntryStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { DirectoryBrowserModalWidget } from './directory-browser-modal-widget';
import { DirectoryBrowserModalWidgetProxy } from './directory-browser-modal-widget.proxy';

describe('DirectoryBrowserModalWidget', () => {
  describe('rendering', () => {
    it('VALID: {opened: true} => renders modal with Browse Directory title', async () => {
      DirectoryBrowserModalWidgetProxy();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <DirectoryBrowserModalWidget opened={true} onClose={jest.fn()} onSelect={jest.fn()} />
            ),
          });
          await Promise.resolve();
        },
      });

      expect(screen.getByText('Browse Directory')).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders current path display', async () => {
      const proxy = DirectoryBrowserModalWidgetProxy();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <DirectoryBrowserModalWidget opened={true} onClose={jest.fn()} onSelect={jest.fn()} />
            ),
          });
          await Promise.resolve();
        },
      });

      expect(proxy.getCurrentPath()).toBe('/');
    });

    it('VALID: {opened: true} => renders Go Up button', async () => {
      DirectoryBrowserModalWidgetProxy();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <DirectoryBrowserModalWidget opened={true} onClose={jest.fn()} onSelect={jest.fn()} />
            ),
          });
          await Promise.resolve();
        },
      });

      expect(screen.getByTestId('GO_UP_BUTTON')).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders Select button', async () => {
      DirectoryBrowserModalWidgetProxy();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <DirectoryBrowserModalWidget opened={true} onClose={jest.fn()} onSelect={jest.fn()} />
            ),
          });
          await Promise.resolve();
        },
      });

      expect(screen.getByTestId('SELECT_DIRECTORY_BUTTON')).toBeInTheDocument();
    });

    it('EMPTY: {no entries} => renders empty directory message', async () => {
      DirectoryBrowserModalWidgetProxy();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <DirectoryBrowserModalWidget opened={true} onClose={jest.fn()} onSelect={jest.fn()} />
            ),
          });
          await Promise.resolve();
        },
      });

      expect(screen.getByTestId('EMPTY_DIRECTORY')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('VALID: {click Select} => calls onSelect with current path', async () => {
      const proxy = DirectoryBrowserModalWidgetProxy();
      const onSelect = jest.fn();

      proxy.setupEntries({
        entries: [DirectoryEntryStub({ name: 'projects', path: '/home/user/projects' })],
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <DirectoryBrowserModalWidget opened={true} onClose={jest.fn()} onSelect={onSelect} />
            ),
          });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.getCurrentPath()).not.toBe('/');
      });

      await proxy.clickSelect();

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('VALID: {click Cancel} => calls onClose', async () => {
      const proxy = DirectoryBrowserModalWidgetProxy();
      const onClose = jest.fn();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <DirectoryBrowserModalWidget opened={true} onClose={onClose} onSelect={jest.fn()} />
            ),
          });
          await Promise.resolve();
        },
      });

      await proxy.clickCancel();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
