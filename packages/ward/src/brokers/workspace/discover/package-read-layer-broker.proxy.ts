import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { readdirEntriesProxy } from '#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { filePathContract } from '@dungeonmaster/shared/contracts';

export const packageReadLayerBrokerProxy = (): {
  setupReturnsPackage: (params: { fullPath: string; name: string }) => void;
  setupReturnsPackageNoSrc: (params: { fullPath: string; name: string }) => void;
  setupThrows: (params: { fullPath: string }) => void;
  setupReturnsNoName: (params: { fullPath: string }) => void;
  getStderrCalls: () => readonly unknown[];
} => {
  const readProxy = readFileProxy();
  const readdirProxy = readdirEntriesProxy();

  const stderr = stderrProxy();

  return {
    getStderrCalls: (): readonly unknown[] => stderr.getWrites(),

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
