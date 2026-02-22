import { workspaceRootFindBroker } from './workspace-root-find-broker';
import { workspaceRootFindBrokerProxy } from './workspace-root-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('workspaceRootFindBroker', () => {
  describe('monorepo workspace root', () => {
    it('VALID: {currentPath: child package} => returns workspace root with workspaces field', async () => {
      const proxy = workspaceRootFindBrokerProxy();
      const currentPath = FilePathStub({ value: '/monorepo/packages/server' });
      const workspaceRoot = '/monorepo';

      proxy.setupWorkspaceRootFound({ currentPath, workspaceRoot });

      const result = await workspaceRootFindBroker({ currentPath });

      expect(result).toBe(workspaceRoot);
    });

    it('VALID: {currentPath: workspace root} => returns cwd when it has workspaces field', async () => {
      const proxy = workspaceRootFindBrokerProxy();
      const cwd = FilePathStub({ value: '/monorepo' });

      proxy.setupWorkspaceRootAtCwd({ cwd });

      const result = await workspaceRootFindBroker({ currentPath: cwd });

      expect(result).toBe('/monorepo');
    });
  });

  describe('single-package project', () => {
    it('VALID: {currentPath: single package} => falls back to cwd when no workspaces found', async () => {
      const proxy = workspaceRootFindBrokerProxy();
      const cwd = FilePathStub({ value: '/single-project' });

      proxy.setupSinglePackageProject({ cwd });

      const result = await workspaceRootFindBroker({ currentPath: cwd });

      expect(result).toMatch(/^\//u);
    });
  });
});
