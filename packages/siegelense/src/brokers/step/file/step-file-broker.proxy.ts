// PURPOSE: Proxy for step-file-broker — composes pathJoinAdapterProxy, fsStatAdapterProxy,
// and fsReadFileAdapterProxy for testing file existence checks and file reading off a lane's
// throwaway home directory or evidence directory.
// USAGE: const proxy = stepFileBrokerProxy(); proxy.setupFileExists({ filePath, content });

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';

export const stepFileBrokerProxy = (): {
  setupFileExists: (params: { filePath: AbsoluteFilePath; content: string }) => void;
  setupFileNotFound: (params: {
    filePath: AbsoluteFilePath;
    evidenceFilePath?: AbsoluteFilePath;
  }) => void;
} => {
  pathJoinAdapterProxy();
  const statProxy = fsStatAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupFileExists: ({
      filePath,
      content,
    }: {
      filePath: AbsoluteFilePath;
      content: string;
    }): void => {
      statProxy.resolves({ filePath, sizeBytes: content.length, modifiedAtMs: 1_700_000_000_000 });
      readFileProxy.resolves({ filePath, content });
    },

    setupFileNotFound: ({
      filePath,
      evidenceFilePath,
    }: {
      filePath: AbsoluteFilePath;
      evidenceFilePath?: AbsoluteFilePath;
    }): void => {
      statProxy.rejects({
        filePath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), {
          code: 'ENOENT',
        }),
      });
      if (evidenceFilePath !== undefined) {
        statProxy.rejects({
          filePath: evidenceFilePath,
          error: Object.assign(new Error('ENOENT: no such file or directory'), {
            code: 'ENOENT',
          }),
        });
      }
    },
  };
};
