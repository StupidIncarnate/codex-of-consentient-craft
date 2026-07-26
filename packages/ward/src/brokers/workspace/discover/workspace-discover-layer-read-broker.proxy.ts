import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirDirsAdapterProxy } from '../../../adapters/fs/readdir-dirs/fs-readdir-dirs-adapter.proxy';

export const workspaceDiscoverLayerReadBrokerProxy = (): {
  setupReturnsPackage: (params: { fullPath: string; name: string }) => void;
  setupReturnsPackageNoSrc: (params: { fullPath: string; name: string }) => void;
  setupThrows: (params: { fullPath: string }) => void;
  setupReturnsNoName: (params: { fullPath: string }) => void;
  getStderrCalls: () => unknown[];
} => {
  const readProxy = fsReadFileAdapterProxy();
  const readdirProxy = fsReaddirDirsAdapterProxy();

  const stderrMock = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrMock.calledWith([]).returns(true);

  return {
    getStderrCalls: (): unknown[] => stderrMock.callsMatching([]).map((call) => call[0]),

    setupReturnsPackage: ({ fullPath, name }: { fullPath: string; name: string }): void => {
      readProxy.returns({
        filePath: filePathContract.parse(`${fullPath}/package.json`),
        content: JSON.stringify({ name }),
      });
      readdirProxy.returns({ dirPath: filePathContract.parse(fullPath), dirs: ['src'] });
    },

    setupReturnsPackageNoSrc: ({ fullPath, name }: { fullPath: string; name: string }): void => {
      readProxy.returns({
        filePath: filePathContract.parse(`${fullPath}/package.json`),
        content: JSON.stringify({ name }),
      });
      readdirProxy.returns({
        dirPath: filePathContract.parse(fullPath),
        dirs: ['define', 'docs'],
      });
    },

    setupThrows: ({ fullPath }: { fullPath: string }): void => {
      readProxy.throws({
        filePath: filePathContract.parse(`${fullPath}/package.json`),
        error: new Error('ENOENT'),
      });
    },

    setupReturnsNoName: ({ fullPath }: { fullPath: string }): void => {
      readProxy.returns({
        filePath: filePathContract.parse(`${fullPath}/package.json`),
        content: JSON.stringify({ version: '1.0.0' }),
      });
    },
  };
};
