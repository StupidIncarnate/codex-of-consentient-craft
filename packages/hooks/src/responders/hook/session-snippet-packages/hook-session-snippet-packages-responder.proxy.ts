/**
 * PURPOSE: Test proxy for HookSessionSnippetPackagesResponder that mocks the packages-directory
 * readdir the responder uses to enumerate package names.
 *
 * USAGE:
 * const proxy = HookSessionSnippetPackagesResponderProxy();
 * proxy.setupEntries({ projectRoot, entries: [{ name: 'cli', isDirectory: true }] });
 * const result = HookSessionSnippetPackagesResponder({ projectRoot });
 */

import type { Dirent } from 'fs';
import {
  fsReaddirWithTypesAdapterProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

const makeDirent = ({ name, isDir }: { name: string; isDir: boolean }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

// The responder builds `${projectRoot}/packages` as the readdir target — mirror that exact join
// here so the mock is keyed on the same dirPath the responder actually reads.
const packagesDirFor = ({ projectRoot }: { projectRoot: AbsoluteFilePath }): AbsoluteFilePath =>
  AbsoluteFilePathStub({ value: `${String(projectRoot)}/packages` });

export const HookSessionSnippetPackagesResponderProxy = (): {
  setupEntries: (params: {
    projectRoot: AbsoluteFilePath;
    entries: { name: string; isDirectory: boolean }[];
  }) => void;
  setupEmptyMonorepo: (params: { projectRoot: AbsoluteFilePath }) => void;
} => {
  processCwdAdapterProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();

  return {
    setupEntries: ({
      projectRoot,
      entries,
    }: {
      projectRoot: AbsoluteFilePath;
      entries: { name: string; isDirectory: boolean }[];
    }): void => {
      readdirProxy.returns({
        dirPath: packagesDirFor({ projectRoot }),
        entries: entries.map((entry) => makeDirent({ name: entry.name, isDir: entry.isDirectory })),
      });
    },

    setupEmptyMonorepo: ({ projectRoot }: { projectRoot: AbsoluteFilePath }): void => {
      // Make the responder's readdir throw so it falls back to the literal 'root' name.
      readdirProxy.throws({
        dirPath: packagesDirFor({ projectRoot }),
        error: new Error('ENOENT: no packages dir'),
      });
    },
  };
};
