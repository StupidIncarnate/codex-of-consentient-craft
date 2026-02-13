import { DirectoryEntryStub, ProjectPathStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useDirectoryBrowserBinding } from './use-directory-browser-binding';
import { useDirectoryBrowserBindingProxy } from './use-directory-browser-binding.proxy';

describe('useDirectoryBrowserBinding', () => {
  describe('loading state', () => {
    it('VALID: {} => starts with loading true and empty entries', () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupEntries({ entries: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDirectoryBrowserBinding(),
      });

      expect(result.current).toStrictEqual({
        currentPath: null,
        entries: [],
        loading: true,
        navigateTo: expect.any(Function),
        goUp: expect.any(Function),
      });
    });
  });

  describe('successful browse', () => {
    it('VALID: {} => returns directory entries and resolves initial path', async () => {
      const proxy = useDirectoryBrowserBindingProxy();
      const entries = [
        DirectoryEntryStub({ name: 'projects', path: '/home/user/projects', isDirectory: true }),
        DirectoryEntryStub({ name: 'readme.md', path: '/home/user/readme.md', isDirectory: false }),
      ];

      proxy.setupEntries({ entries });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDirectoryBrowserBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.currentPath).toBe('/home/user');
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current.entries).toStrictEqual(entries);
    });
  });

  describe('navigateTo', () => {
    it('VALID: {navigateTo called} => updates currentPath and re-fetches', async () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupEntries({
        entries: [DirectoryEntryStub({ name: 'home', path: '/home', isDirectory: true })],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDirectoryBrowserBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      const targetPath = ProjectPathStub({ value: '/home' });

      proxy.setupEntries({
        entries: [DirectoryEntryStub({ name: 'user', path: '/home/user', isDirectory: true })],
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.navigateTo({ path: targetPath });
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current.currentPath).toBe('/home');
      expect(result.current.entries).toStrictEqual([
        DirectoryEntryStub({ name: 'user', path: '/home/user', isDirectory: true }),
      ]);
    });
  });

  describe('goUp', () => {
    it('VALID: {goUp from /home/user} => navigates to /home', async () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupEntries({ entries: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDirectoryBrowserBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      const targetPath = ProjectPathStub({ value: '/home/user' });

      proxy.setupEntries({ entries: [] });

      testingLibraryActAdapter({
        callback: () => {
          result.current.navigateTo({ path: targetPath });
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.currentPath).toBe('/home/user');
        },
      });

      proxy.setupEntries({ entries: [] });

      testingLibraryActAdapter({
        callback: () => {
          result.current.goUp();
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.currentPath).toBe('/home');
        },
      });

      expect(result.current.currentPath).toBe('/home');
    });

    it('EDGE: {goUp from null} => stays at null', async () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupEntries({ entries: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDirectoryBrowserBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.goUp();
        },
      });

      expect(result.current.currentPath).toBeNull();
    });
  });

  describe('error handling', () => {
    it('ERROR: {broker throws} => sets entries to empty array', async () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupError({ error: new Error('Failed to browse') });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDirectoryBrowserBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        currentPath: null,
        entries: [],
        loading: false,
        navigateTo: expect.any(Function),
        goUp: expect.any(Function),
      });
    });
  });
});
