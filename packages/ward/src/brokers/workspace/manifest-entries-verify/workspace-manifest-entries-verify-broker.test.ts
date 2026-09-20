import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { workspaceManifestEntriesVerifyBroker } from './workspace-manifest-entries-verify-broker';
import { workspaceManifestEntriesVerifyBrokerProxy } from './workspace-manifest-entries-verify-broker.proxy';

describe('workspaceManifestEntriesVerifyBroker', () => {
  describe('declared entry exists on disk', () => {
    it('VALID: {main points to a file that exists} => returns an empty array', async () => {
      const proxy = workspaceManifestEntriesVerifyBrokerProxy();
      const packagePath = AbsoluteFilePathStub({ value: '/repo/packages/example' });

      proxy.setupManifest({
        manifestPath: FilePathStub({ value: '/repo/packages/example/package.json' }),
        manifestJson: JSON.stringify({ main: 'dist/index.js' }),
      });
      proxy.setupFileExists({
        filePath: FilePathStub({ value: '/repo/packages/example/dist/index.js' }),
      });

      const result = await workspaceManifestEntriesVerifyBroker({ packagePath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('declared entry missing from disk', () => {
    it('VALID: {main points to a file that does not exist} => returns the main declaration', async () => {
      const proxy = workspaceManifestEntriesVerifyBrokerProxy();
      const packagePath = AbsoluteFilePathStub({ value: '/repo/packages/example' });

      proxy.setupManifest({
        manifestPath: FilePathStub({ value: '/repo/packages/example/package.json' }),
        manifestJson: JSON.stringify({ main: 'dist/index.js' }),
      });
      proxy.setupFileMissing({
        filePath: FilePathStub({ value: '/repo/packages/example/dist/index.js' }),
      });

      const result = await workspaceManifestEntriesVerifyBroker({ packagePath });

      expect(result).toStrictEqual([{ field: 'main', declaredPath: 'dist/index.js' }]);
    });

    it('VALID: {exports["."]["import"] missing, exports["."]["source"] never checked} => returns only the import mismatch', async () => {
      const proxy = workspaceManifestEntriesVerifyBrokerProxy();
      const packagePath = AbsoluteFilePathStub({ value: '/repo/packages/example' });

      proxy.setupManifest({
        manifestPath: FilePathStub({ value: '/repo/packages/example/package.json' }),
        manifestJson: JSON.stringify({
          exports: {
            '.': {
              source: './src/index.ts',
              import: './dist/index.js',
            },
          },
        }),
      });
      proxy.setupFileMissing({
        filePath: FilePathStub({ value: '/repo/packages/example/./dist/index.js' }),
      });

      const result = await workspaceManifestEntriesVerifyBroker({ packagePath });

      expect(result).toStrictEqual([
        { field: 'exports["."]["import"]', declaredPath: './dist/index.js' },
      ]);
    });
  });

  describe('manifest with nothing to verify', () => {
    it('EMPTY: {manifest with no main/types/bin/exports} => returns an empty array', async () => {
      const proxy = workspaceManifestEntriesVerifyBrokerProxy();
      const packagePath = AbsoluteFilePathStub({ value: '/repo/packages/example' });

      proxy.setupManifest({
        manifestPath: FilePathStub({ value: '/repo/packages/example/package.json' }),
        manifestJson: JSON.stringify({ name: '@dungeonmaster/example' }),
      });

      const result = await workspaceManifestEntriesVerifyBroker({ packagePath });

      expect(result).toStrictEqual([]);
    });
  });
});
