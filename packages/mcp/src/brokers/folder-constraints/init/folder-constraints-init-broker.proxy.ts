/**
 * PURPOSE: Test setup helper for folder constraints init broker
 *
 * USAGE:
 * const proxy = folderConstraintsInitBrokerProxy();
 * proxy.setupConstraintFiles({ 'brokers-constraints.md': ContentTextStub() });
 * await folderConstraintsInitBroker();
 */
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

export const folderConstraintsInitBrokerProxy = (): {
  setupConstraintFiles: (params: Record<FilePath, ContentText>) => void;
  setupFileReadError: (params: { filename: FilePath }) => void;
} => {
  pathResolveAdapterProxy();
  const fsProxy = fsReadFileAdapterProxy();

  return {
    setupConstraintFiles: (files: Record<FilePath, ContentText>): void => {
      for (const [filepath, content] of Object.entries(files)) {
        // Strip the \n prefix that the broker adds before parsing
        const stripped = content.slice(1);
        fsProxy.returns({
          filepath: filepath as FilePath,
          contents: FileContentsStub({ value: stripped }),
        });
      }
    },

    setupFileReadError: ({ filename }: { filename: FilePath }): void => {
      fsProxy.throws({
        filepath: filename,
        error: new Error(`File not found: ${filename}`),
      });
    },
  };
};
