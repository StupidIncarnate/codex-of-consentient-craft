import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const readFirstExistingCandidateLayerBrokerProxy = (): {
  setupFile: (params: { filePath: FilePath; content: string }) => void;
  setupMissing: (params: { filePath: FilePath }) => void;
  setupPermissionDenied: (params: { filePath: FilePath }) => void;
} => {
  const fsProxy = fsReadFileAdapterProxy();

  return {
    setupFile: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      fsProxy.returns({ filePath, content });
    },
    setupMissing: ({ filePath }: { filePath: FilePath }): void => {
      fsProxy.throws({ filePath, error: Object.assign(new Error('ENOENT'), { code: 'ENOENT' }) });
    },
    setupPermissionDenied: ({ filePath }: { filePath: FilePath }): void => {
      fsProxy.throws({ filePath, error: Object.assign(new Error('EACCES'), { code: 'EACCES' }) });
    },
  };
};
