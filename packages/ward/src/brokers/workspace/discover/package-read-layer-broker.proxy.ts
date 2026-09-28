import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { readdirEntriesProxy } from '#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { filePathContract } from '@dungeonmaster/shared/contracts';

export const packageReadLayerBrokerProxy = (): {
  setupReturnsPackage: (params: { fullPath: string; name: string }) => void;
  setupReturnsPackageNoSrc: (params: { fullPath: string; name: string }) => void;
  setupThrows: (params: { fullPath: string }) => void;
  setupReturnsNoName: (params: { fullPath: string }) => void;
  getStderrCalls: () => unknown[];
} => {
  const readProxy = readFileProxy();
  const readdirProxy = readdirEntriesProxy();

  const stderrMock = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrMock.calledWith([]).returns(true);

  return {
    getStderrCalls: (): unknown[] => stderrMock.callsMatching([]).map((call) => call[0]),

    setupReturnsPackage: ({ fullPath, name }: { fullPath: string; name: string }): void => {
      readProxy.returns({
        path: filePathContract.parse(`${fullPath}/package.json`),
        contents: JSON.stringify({ name }),
      });
      readdirProxy.returns({ path: fullPath, entries: [{ name: 'src', kind: 'directory' }] });
    },

    setupReturnsPackageNoSrc: ({ fullPath, name }: { fullPath: string; name: string }): void => {
      readProxy.returns({
        path: filePathContract.parse(`${fullPath}/package.json`),
        contents: JSON.stringify({ name }),
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
      readProxy.missing({ path: filePathContract.parse(`${fullPath}/package.json`) });
    },

    setupReturnsNoName: ({ fullPath }: { fullPath: string }): void => {
      readProxy.returns({
        path: filePathContract.parse(`${fullPath}/package.json`),
        contents: JSON.stringify({ version: '1.0.0' }),
      });
    },
  };
};
