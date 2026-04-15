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
import type { PathSegment } from '@dungeonmaster/shared/contracts';
import { FileContentsStub } from '@dungeonmaster/shared/contracts';

export const folderConstraintsInitBrokerProxy = (): {
  setupConstraintFiles: (params: Record<PathSegment, ContentText>) => void;
  setupFileReadError: (params: { filename: PathSegment }) => void;
} => {
  pathResolveAdapterProxy();
  const fsProxy = fsReadFileAdapterProxy();

  return {
    setupConstraintFiles: (files: Record<PathSegment, ContentText>): void => {
      for (const [filepath, content] of Object.entries(files)) {
        // Strip the \n prefix that the broker adds before parsing
        const stripped = content.slice(1);
        fsProxy.returns({
          filepath: filepath as PathSegment,
          contents: FileContentsStub({ value: stripped }),
        });
      }
    },

    setupFileReadError: ({ filename }: { filename: PathSegment }): void => {
      fsProxy.throws({
        filepath: filename,
        error: new Error(`File not found: ${filename}`),
      });
    },
  };
};
