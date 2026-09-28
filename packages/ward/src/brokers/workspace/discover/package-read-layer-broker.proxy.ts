import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { readdirEntriesProxy } from '#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const packageReadLayerBrokerProxy = (): {
  setupReturnsPackage: (params: { fullPath: string; name: string }) => void;
  setupReturnsPackageNoSrc: (params: { fullPath: string; name: string }) => void;
  setupThrows: (params: { fullPath: string }) => void;
  setupReturnsNoName: (params: { fullPath: string }) => void;
  getStderrCalls: () => unknown[];
} => {
  const readProxy = fsReadFileAdapterProxy();
  const readdirProxy = readdirEntriesProxy();

  const stderrMock = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrMock.calledWith([]).returns(true);

  return {
    getStderrCalls: (): unknown[] => stderrMock.callsMatching([]).map((call) => call[0]),

    setupReturnsPackage: ({ fullPath, name }: { fullPath: string; name: string }): void => {
      readProxy.returns({
        filePath: filePathContract.parse(`${fullPath}/package.json`),
        content: JSON.stringify({ name }),
      });
      readdirProxy.returns({ path: fullPath, entries: [{ name: 'src', kind: 'directory' }] });
    },

    setupReturnsPackageNoSrc: ({ fullPath, name }: { fullPath: string; name: string }): void => {
      readProxy.returns({
        filePath: filePathContract.parse(`${fullPath}/package.json`),
        content: JSON.stringify({ name }),
      });
      readdirProxy.returns({
        path: fullPath,
        entries: [
          { name: 'define', kind: 'directory' },
          { name: 'docs', kind: 'directory' },
        ],
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
