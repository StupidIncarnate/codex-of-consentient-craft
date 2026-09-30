/**
 * PURPOSE: Test proxy for HookSessionSnippetPackagesResponder that mocks the packages-directory
 * readdir the responder uses to enumerate package names.
 *
 * USAGE:
 * const proxy = HookSessionSnippetPackagesResponderProxy();
 * proxy.setupEntries({ projectRoot, entries: [{ name: 'cli', isDirectory: true }] });
 * const result = HookSessionSnippetPackagesResponder({ projectRoot });
 */

import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

// The responder builds `${projectRoot}/packages` as the readdir target — mirror that exact join
// here so the mock is keyed on the same dirPath the responder actually reads.
const packagesDirFor = ({ projectRoot }: { projectRoot: string }): string =>
  `${String(projectRoot)}/packages`;

export const HookSessionSnippetPackagesResponderProxy = (): {
  setupEntries: (params: {
    projectRoot: string;
    entries: {
      name: string;
      isDirectory: boolean;
      // Present only on a `@scope` group entry — its own children are staged as a second readdir
      // call into the group's directory, mirroring the two calls the responder itself makes.
      children?: { name: string; isDirectory: boolean }[];
    }[];
  }) => void;
  setupEmptyMonorepo: (params: { projectRoot: string }) => void;
} => {
  const cwd = cwdProxy();
  const readdirProxy = readdirEntriesSyncProxy();

  return {
    setupEntries: ({
      projectRoot,
      entries,
    }: {
      projectRoot: string;
      entries: {
        name: string;
        isDirectory: boolean;
        children?: { name: string; isDirectory: boolean }[];
      }[];
    }): void => {
      cwd.setupCwd({ value: projectRoot });
      const packagesDir = packagesDirFor({ projectRoot });
      readdirProxy.returns({
        path: packagesDir,
        entries: entries.map((entry) => ({
          name: entry.name,
          kind: entry.isDirectory ? ('directory' as const) : ('file' as const),
        })),
      });

      for (const entry of entries) {
        if (entry.children) {
          readdirProxy.returns({
            path: `${String(packagesDir)}/${entry.name}`,
            entries: entry.children.map((child) => ({
              name: child.name,
              kind: child.isDirectory ? ('directory' as const) : ('file' as const),
            })),
          });
        }
      }
    },

    setupEmptyMonorepo: ({ projectRoot }: { projectRoot: string }): void => {
      cwd.setupCwd({ value: projectRoot });
      // Make the responder's readdir throw so it falls back to the literal 'root' name.
      readdirProxy.throws({
        path: packagesDirFor({ projectRoot }),
        error: FileMissingErrorStub({ path: packagesDirFor({ projectRoot }) }),
      });
    },
  };
};
