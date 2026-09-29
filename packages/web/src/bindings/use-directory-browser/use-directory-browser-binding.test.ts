import { DirectoryEntryStub } from '@dungeonmaster/shared/contracts/directory-entry/directory-entry.stub';
import { GuildPathStub } from '@dungeonmaster/shared/contracts/guild-path/guild-path.stub';

import { act, renderHook, waitFor } from '#gateway/npm/testing-library__react';

import { useDirectoryBrowserBinding } from './use-directory-browser-binding';
import { useDirectoryBrowserBindingProxy } from './use-directory-browser-binding.proxy';

describe('useDirectoryBrowserBinding', () => {
  describe('loading state', () => {
    it('VALID: {} => starts with loading true and empty entries', () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupEntries({ entries: [] });

      const { result } = renderHook(() => useDirectoryBrowserBinding());

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

      const { result } = renderHook(() => useDirectoryBrowserBinding());

      const currentState = (): ReturnType<typeof useDirectoryBrowserBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        currentPath: '/home/user',
        entries,
        loading: false,
        navigateTo: expect.any(Function),
        goUp: expect.any(Function),
      });
    });
  });

  describe('navigateTo', () => {
    it('VALID: {navigateTo called} => updates currentPath and re-fetches', async () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupEntries({
        entries: [DirectoryEntryStub({ name: 'home', path: '/home', isDirectory: true })],
      });

      const { result } = renderHook(() => useDirectoryBrowserBinding());

      const currentState = (): ReturnType<typeof useDirectoryBrowserBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      const targetPath = GuildPathStub({ value: '/home' });
      const { navigateTo } = result.current;

      proxy.setupEntries({
        entries: [DirectoryEntryStub({ name: 'user', path: '/home/user', isDirectory: true })],
      });

      act(() => {
        navigateTo({ path: targetPath });
      });

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        currentPath: '/home',
        entries: [DirectoryEntryStub({ name: 'user', path: '/home/user', isDirectory: true })],
        loading: false,
        navigateTo: expect.any(Function),
        goUp: expect.any(Function),
      });
    });
  });

  describe('goUp', () => {
    it('VALID: {goUp from /home/user} => navigates to /home', async () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupEntries({ entries: [] });

      const { result } = renderHook(() => useDirectoryBrowserBinding());

      const currentState = (): ReturnType<typeof useDirectoryBrowserBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      const targetPath = GuildPathStub({ value: '/home/user' });

      proxy.setupEntries({ entries: [] });

      act(() => {
        result.current.navigateTo({ path: targetPath });
      });

      await waitFor(() => {
        expect(currentState().currentPath).toBe('/home/user');
      });

      proxy.setupEntries({ entries: [] });

      act(() => {
        result.current.goUp();
      });

      await waitFor(() => {
        expect(currentState().currentPath).toBe('/home');
      });

      expect(result.current.currentPath).toBe('/home');
    });

    it('EDGE: {goUp from null} => stays at null', async () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupEntries({ entries: [] });

      const { result } = renderHook(() => useDirectoryBrowserBinding());

      const currentState = (): ReturnType<typeof useDirectoryBrowserBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      const { goUp } = result.current;

      act(() => {
        goUp();
      });

      expect(result.current.currentPath).toBe(null);
    });
  });

  describe('error handling', () => {
    it('ERROR: {broker throws} => sets entries to empty array', async () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupError();

      const { result } = renderHook(() => useDirectoryBrowserBinding());

      const currentState = (): ReturnType<typeof useDirectoryBrowserBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
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

  describe('error logging', () => {
    it('ERROR: {broker throws and inner catch handles it} => does not log to console.error', async () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupError();

      const consoleErrorCalls = proxy.getConsoleErrorCalls();

      const { result } = renderHook(() => useDirectoryBrowserBinding());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleErrorCalls).toStrictEqual([]);
    });

    it('ERROR: {broker rejects with poison toString} => inner bare catch swallows error without logging', async () => {
      const proxy = useDirectoryBrowserBindingProxy();
      proxy.setupOuterCatchTrigger();

      const consoleErrorCalls = proxy.getConsoleErrorCalls();

      const { result } = renderHook(() => useDirectoryBrowserBinding());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleErrorCalls).toStrictEqual([]);
    });
  });
});
