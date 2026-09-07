import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';

export const cryptoHashFilesAdapterProxy = (): {
  hasFile: (params: {
    rootPath: AbsoluteFilePath;
    relativePath: GitRelativePath;
    contents: string;
  }) => void;
  isDirectory: (params: { rootPath: AbsoluteFilePath; relativePath: GitRelativePath }) => void;
  isMissing: (params: { rootPath: AbsoluteFilePath; relativePath: GitRelativePath }) => void;
  failsWith: (params: {
    rootPath: AbsoluteFilePath;
    relativePath: GitRelativePath;
    code: string;
  }) => void;
} => {
  const mock = registerMock({ fn: readFileSync });

  return {
    hasFile: ({
      rootPath,
      relativePath,
      contents,
    }: {
      rootPath: AbsoluteFilePath;
      relativePath: GitRelativePath;
      contents: string;
    }): void => {
      mock
        .calledWith([`${String(rootPath)}/${String(relativePath)}`])
        .returns(Buffer.from(contents, 'utf8'));
    },
    isDirectory: ({
      rootPath,
      relativePath,
    }: {
      rootPath: AbsoluteFilePath;
      relativePath: GitRelativePath;
    }): void => {
      mock.calledWith([`${String(rootPath)}/${String(relativePath)}`]).throws(
        Object.assign(new Error('EISDIR: illegal operation on a directory'), {
          code: 'EISDIR',
        }),
      );
    },
    isMissing: ({
      rootPath,
      relativePath,
    }: {
      rootPath: AbsoluteFilePath;
      relativePath: GitRelativePath;
    }): void => {
      mock
        .calledWith([`${String(rootPath)}/${String(relativePath)}`])
        .throws(Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }));
    },
    failsWith: ({
      rootPath,
      relativePath,
      code,
    }: {
      rootPath: AbsoluteFilePath;
      relativePath: GitRelativePath;
      code: string;
    }): void => {
      mock
        .calledWith([`${String(rootPath)}/${String(relativePath)}`])
        .throws(Object.assign(new Error(`${code}: read failed`), { code }));
    },
  };
};
