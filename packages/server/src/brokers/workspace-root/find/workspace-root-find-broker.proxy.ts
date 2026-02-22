/**
 * PURPOSE: Proxy for workspace-root-find-broker that mocks the broker at the module level
 *
 * USAGE:
 * const proxy = workspaceRootFindBrokerProxy();
 * proxy.setupWorkspaceRootFound({ currentPath, workspaceRoot });
 * // Mocks the broker to return specified workspace root
 */

import { pathDirnameAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { workspaceRootFindBroker as WorkspaceRootFindBrokerType } from './workspace-root-find-broker';

jest.mock('./workspace-root-find-broker');

export const workspaceRootFindBrokerProxy = (): {
  setupWorkspaceRootFound: (params: { currentPath: string; workspaceRoot: string }) => void;
  setupWorkspaceRootAtCwd: (params: { cwd: string }) => void;
  setupSinglePackageProject: (params: { cwd: string }) => void;
} => {
  pathDirnameAdapterProxy();
  pathJoinAdapterProxy();
  fsReadFileAdapterProxy();

  const brokerModule = jest.requireMock<{
    workspaceRootFindBroker: jest.MockedFunction<typeof WorkspaceRootFindBrokerType>;
  }>('./workspace-root-find-broker');

  // Default: resolve to cwd
  brokerModule.workspaceRootFindBroker.mockResolvedValue(process.cwd() as never);

  return {
    setupWorkspaceRootFound: ({
      workspaceRoot,
    }: {
      currentPath: string;
      workspaceRoot: string;
    }): void => {
      brokerModule.workspaceRootFindBroker.mockResolvedValue(workspaceRoot as never);
    },

    setupWorkspaceRootAtCwd: ({ cwd }: { cwd: string }): void => {
      brokerModule.workspaceRootFindBroker.mockResolvedValue(cwd as never);
    },

    setupSinglePackageProject: ({ cwd }: { cwd: string }): void => {
      brokerModule.workspaceRootFindBroker.mockResolvedValue(cwd as never);
    },
  };
};
