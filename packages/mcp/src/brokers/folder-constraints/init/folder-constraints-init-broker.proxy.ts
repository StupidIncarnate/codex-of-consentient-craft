/**
 * PURPOSE: Test setup helper for folder constraints init broker
 *
 * USAGE:
 * const proxy = folderConstraintsInitBrokerProxy();
 * proxy.setupConstraintFiles({ 'brokers-constraints.md': ContentTextStub() });
 * await folderConstraintsInitBroker();
 */
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const folderConstraintsInitBrokerProxy = (): {
  setupConstraintFiles: (params: Record<FilePath, ContentText>) => void;
  setupFileReadError: (params: { filename: FilePath }) => void;
} => {
  const mockFiles = new Map<FilePath, ContentText>();

  return {
    setupConstraintFiles: (files: Record<FilePath, ContentText>): void => {
      // Mock pathResolveAdapter to return predictable paths
      jest.spyOn({ pathResolveAdapter }, 'pathResolveAdapter').mockImplementation(({ paths }) => {
        return paths.join('/') as never;
      });

      // Mock fsReadFileAdapter to return file content from map
      jest
        .spyOn({ fsReadFileAdapter }, 'fsReadFileAdapter')
        .mockImplementation(async ({ filepath }) => {
          const parts = filepath.split('/');
          const filename = parts[parts.length - 1] as FilePath;
          if (filename && mockFiles.has(filename)) {
            const content = mockFiles.get(filename);
            // Strip the \n prefix that the broker adds
            const stripped = content?.slice(1);
            return (stripped ?? '') as never;
          }
          throw new Error(`File not found: ${filepath}`);
        });

      // Store files in map
      for (const [filename, content] of Object.entries(files)) {
        mockFiles.set(filename as FilePath, content);
      }
    },

    setupFileReadError: ({ filename }: { filename: FilePath }): void => {
      // File not in map will throw error when read
      mockFiles.delete(filename);
    },
  };
};
