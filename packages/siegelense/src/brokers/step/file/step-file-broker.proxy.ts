// PURPOSE: Proxy for step-file-broker — composes statIfExistsProxy and readFileProxy for
// testing file existence checks and file reading off a lane's throwaway home directory or evidence
// directory. `join` (from '#gateway/node/path') is mocked directly, on a sticky real-passthrough
// default: both segments of every join this broker makes (a lane's home/evidence path, plus the
// step's own file path) are already known at test-setup time, so the real computed path always
// matches what `setupFileExists`/`setupFileNotFound` stage on statIfExists/readFile.
// USAGE: const proxy = stepFileBrokerProxy(); proxy.setupFileExists({ filePath, content });

import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';

export const stepFileBrokerProxy = (): {
  setupFileExists: (params: { filePath: string; content: string }) => void;
  setupFileNotFound: (params: {
    filePath: string;
    evidenceFilePath?: string;
  }) => void;
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper, so
  // no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path' specifier
  // the broker imports.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  const statProxy = statIfExistsProxy();
  const readFileMock = readFileProxy();

  return {
    setupFileExists: ({
      filePath,
      content,
    }: {
      filePath: string;
      content: string;
    }): void => {
      statProxy.returnsFile({
        path: filePath,
        sizeBytes: content.length,
        modifiedAtMs: 1_700_000_000_000,
      });
      readFileMock.returns({ path: filePath, contents: content });
    },

    setupFileNotFound: ({
      filePath,
      evidenceFilePath,
    }: {
      filePath: string;
      evidenceFilePath?: string;
    }): void => {
      statProxy.missing({ path: filePath });
      if (evidenceFilePath !== undefined) {
        statProxy.missing({ path: evidenceFilePath });
      }
    },
  };
};
