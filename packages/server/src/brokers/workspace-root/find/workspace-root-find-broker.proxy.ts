import { pathDirnameAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { workspaceRootFindBroker as WorkspaceRootFindBrokerType } from './workspace-root-find-broker';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

jest.mock('./workspace-root-find-broker');

export const workspaceRootFindBrokerProxy = (): {
  setupWorkspaceRootFound: (params: { currentPath: string; workspaceRoot: string }) => void;
  setupWorkspaceRootAtCwd: (params: { cwd: string }) => void;
  setupSinglePackageProject: (params: { cwd: string }) => void;
} => {
  const dirnameProxy = pathDirnameAdapterProxy();
  const joinProxy = pathJoinAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  const brokerModule = jest.requireMock<{
    workspaceRootFindBroker: jest.MockedFunction<typeof WorkspaceRootFindBrokerType>;
  }>('./workspace-root-find-broker');

  // Default: resolve to cwd
  brokerModule.workspaceRootFindBroker.mockResolvedValue(process.cwd() as never);

  return {
    setupWorkspaceRootFound: ({
      currentPath,
      workspaceRoot,
    }: {
      currentPath: string;
      workspaceRoot: string;
    }): void => {
      brokerModule.workspaceRootFindBroker.mockResolvedValue(workspaceRoot as never);

      // Also set up adapter-level mocks for unit tests
      joinProxy.returns({ result: `${currentPath}/package.json` as never });
      readFileProxy.returns({
        filepath: `${currentPath}/package.json` as never,
        contents: JSON.stringify({ name: 'child-package' }) as FileContents,
      });
      dirnameProxy.returns({ result: workspaceRoot as never });
      joinProxy.returns({ result: `${workspaceRoot}/package.json` as never });
      readFileProxy.returns({
        filepath: `${workspaceRoot}/package.json` as never,
        contents: JSON.stringify({
          name: 'monorepo',
          workspaces: ['packages/*'],
        }) as FileContents,
      });
    },

    setupWorkspaceRootAtCwd: ({ cwd }: { cwd: string }): void => {
      brokerModule.workspaceRootFindBroker.mockResolvedValue(cwd as never);

      joinProxy.returns({ result: `${cwd}/package.json` as never });
      readFileProxy.returns({
        filepath: `${cwd}/package.json` as never,
        contents: JSON.stringify({
          name: 'monorepo',
          workspaces: ['packages/*'],
        }) as FileContents,
      });
    },

    setupSinglePackageProject: ({ cwd }: { cwd: string }): void => {
      brokerModule.workspaceRootFindBroker.mockResolvedValue(cwd as never);

      joinProxy.returns({ result: `${cwd}/package.json` as never });
      readFileProxy.returns({
        filepath: `${cwd}/package.json` as never,
        contents: JSON.stringify({ name: 'single-package' }) as FileContents,
      });
      dirnameProxy.returns({ result: '/' as never });
      joinProxy.returns({ result: '/package.json' as never });
      readFileProxy.throws({
        filepath: '/package.json' as never,
        error: new Error('ENOENT'),
      });
      dirnameProxy.returns({ result: '/' as never });
    },
  };
};
