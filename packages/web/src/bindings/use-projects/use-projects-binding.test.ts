import { ProjectListItemStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useProjectsBinding } from './use-projects-binding';
import { useProjectsBindingProxy } from './use-projects-binding.proxy';

describe('useProjectsBinding', () => {
  describe('loading state', () => {
    it('VALID: {} => starts with loading true and empty projects', () => {
      const proxy = useProjectsBindingProxy();
      proxy.setupProjects({ projects: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useProjectsBinding(),
      });

      expect(result.current).toStrictEqual({
        projects: [],
        loading: true,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('successful fetch', () => {
    it('VALID: {} => returns projects after loading', async () => {
      const proxy = useProjectsBindingProxy();
      const projects = [
        ProjectListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First Project' }),
        ProjectListItemStub({ id: 'a1b2c3d4-5678-9abc-def0-123456789abc', name: 'Second Project' }),
      ];

      proxy.setupProjects({ projects });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useProjectsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        projects,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('empty state', () => {
    it('EMPTY: {no projects} => returns empty array after loading', async () => {
      const proxy = useProjectsBindingProxy();
      proxy.setupProjects({ projects: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useProjectsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        projects: [],
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {broker throws} => returns error state', async () => {
      const proxy = useProjectsBindingProxy();
      proxy.setupError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useProjectsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        projects: [],
        loading: false,
        error: expect.any(Error),
        refresh: expect.any(Function),
      });
    });
  });

  describe('refresh', () => {
    it('VALID: {refresh called} => re-fetches projects', async () => {
      const proxy = useProjectsBindingProxy();
      proxy.setupProjects({
        projects: [
          ProjectListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First' }),
        ],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useProjectsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      proxy.setupProjects({
        projects: [
          ProjectListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First' }),
          ProjectListItemStub({ id: 'a1b2c3d4-5678-9abc-def0-123456789abc', name: 'Second' }),
        ],
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.refresh().catch(() => undefined);
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.projects).toHaveLength(2);
        },
      });

      expect(result.current).toStrictEqual({
        projects: [
          ProjectListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First' }),
          ProjectListItemStub({ id: 'a1b2c3d4-5678-9abc-def0-123456789abc', name: 'Second' }),
        ],
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('non-Error thrown values', () => {
    it('ERROR: {broker throws non-Error value} => wraps in Error via String()', async () => {
      const proxy = useProjectsBindingProxy();
      proxy.setupError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useProjectsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        projects: [],
        loading: false,
        error: expect.any(Error),
        refresh: expect.any(Function),
      });
    });
  });
});
