import { architecturePackageInventoryBroker } from './architecture-package-inventory-broker';
import { architecturePackageInventoryBrokerProxy } from './architecture-package-inventory-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('architecturePackageInventoryBroker', () => {
  describe('header line and description', () => {
    it('VALID: package with description => header includes file count and description', () => {
      const proxy = architecturePackageInventoryBrokerProxy();

      proxy.setupPackage({
        packageName: 'web',
        description: ContentTextStub({ value: 'Web UI' }),
        folders: [
          {
            name: 'contracts',
            entries: [
              { name: 'chat-entry', isDir: true },
              { name: 'quest-id', isDir: true },
            ],
          },
        ],
      });

      const result = architecturePackageInventoryBroker({
        packageName: ContentTextStub({ value: 'web' }),
        srcPath: AbsoluteFilePathStub({ value: '/repo/packages/web/src' }),
        packageJsonPath: AbsoluteFilePathStub({ value: '/repo/packages/web/package.json' }),
      });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: ['## web (6 files) — Web UI', '  contracts/ (6) — chat-entry/, quest-id/'].join(
            '\n',
          ),
        }),
      );
    });

    it('VALID: package without description => header omits description separator', () => {
      const proxy = architecturePackageInventoryBrokerProxy();

      proxy.setupPackage({
        packageName: 'tools',
        folders: [
          {
            name: 'contracts',
            entries: [{ name: 'config', isDir: true }],
          },
        ],
      });

      const result = architecturePackageInventoryBroker({
        packageName: ContentTextStub({ value: 'tools' }),
        srcPath: AbsoluteFilePathStub({ value: '/repo/packages/tools/src' }),
        packageJsonPath: AbsoluteFilePathStub({ value: '/repo/packages/tools/package.json' }),
      });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: ['## tools (3 files)', '  contracts/ (3) — config/'].join('\n'),
        }),
      );
    });
  });

  describe('empty src directory', () => {
    it('EMPTY: package with empty src => header plus empty label only', () => {
      const proxy = architecturePackageInventoryBrokerProxy();
      proxy.setupEmpty();

      const result = architecturePackageInventoryBroker({
        packageName: ContentTextStub({ value: 'web' }),
        srcPath: AbsoluteFilePathStub({ value: '/repo/packages/web/src' }),
        packageJsonPath: AbsoluteFilePathStub({ value: '/repo/packages/web/package.json' }),
      });

      expect(result).toStrictEqual(
        ContentTextStub({ value: ['## web (0 files)', '  (empty)'].join('\n') }),
      );
    });
  });

  describe('folder iteration and depth handling', () => {
    it('VALID: depth 1 folder type => lists first-level subdirectory names', () => {
      const proxy = architecturePackageInventoryBrokerProxy();

      proxy.setupPackage({
        packageName: 'app',
        folders: [
          {
            name: 'contracts',
            entries: [
              { name: 'chat-entry', isDir: true },
              { name: 'quest-id', isDir: true },
              { name: 'user-input', isDir: true },
            ],
          },
        ],
      });

      const result = architecturePackageInventoryBroker({
        packageName: ContentTextStub({ value: 'app' }),
        srcPath: AbsoluteFilePathStub({ value: '/repo/packages/app/src' }),
        packageJsonPath: AbsoluteFilePathStub({ value: '/repo/packages/app/package.json' }),
      });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '## app (9 files)',
            '  contracts/ (9) — chat-entry/, quest-id/, user-input/',
          ].join('\n'),
        }),
      );
    });

    it('VALID: depth 2 folder type => lists domain (action1, action2) pairs', () => {
      const proxy = architecturePackageInventoryBrokerProxy();

      proxy.setupPackage({
        packageName: 'app',
        folders: [
          {
            name: 'brokers',
            entries: [
              { name: 'guild', isDir: true },
              { name: 'quest', isDir: true },
            ],
            subEntries: {
              guild: [
                { name: 'create', isDir: true },
                { name: 'list', isDir: true },
              ],
              quest: [
                { name: 'modify', isDir: true },
                { name: 'start', isDir: true },
              ],
            },
          },
        ],
      });

      const result = architecturePackageInventoryBroker({
        packageName: ContentTextStub({ value: 'app' }),
        srcPath: AbsoluteFilePathStub({ value: '/repo/packages/app/src' }),
        packageJsonPath: AbsoluteFilePathStub({ value: '/repo/packages/app/package.json' }),
      });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '## app (12 files)',
            '  brokers/ (12) — guild/ (create/, list/), quest/ (modify/, start/)',
          ].join('\n'),
        }),
      );
    });

    it('VALID: depth 0 folder type (startup) => lists file stems without extensions', () => {
      const proxy = architecturePackageInventoryBrokerProxy();

      proxy.setupPackage({
        packageName: 'app',
        folders: [
          {
            name: 'startup',
            entries: [
              { name: 'start-app.ts', isDir: false },
              { name: 'start-server.ts', isDir: false },
            ],
          },
        ],
      });

      const result = architecturePackageInventoryBroker({
        packageName: ContentTextStub({ value: 'app' }),
        srcPath: AbsoluteFilePathStub({ value: '/repo/packages/app/src' }),
        packageJsonPath: AbsoluteFilePathStub({ value: '/repo/packages/app/package.json' }),
      });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: ['## app (2 files)', '  startup/ (2) — start-app, start-server'].join('\n'),
        }),
      );
    });
  });

  describe('empty folder branches', () => {
    it('EDGE: folder type with 0 files => folder type still shown with (0) count', () => {
      const proxy = architecturePackageInventoryBrokerProxy();

      proxy.setupPackage({
        packageName: 'cli',
        folders: [
          {
            name: 'bin',
            entries: [],
          },
          {
            name: 'brokers',
            entries: [{ name: 'guild', isDir: true }],
            subEntries: {
              guild: [
                { name: 'create', isDir: true },
                { name: 'list', isDir: true },
              ],
            },
          },
        ],
      });

      const result = architecturePackageInventoryBroker({
        packageName: ContentTextStub({ value: 'cli' }),
        srcPath: AbsoluteFilePathStub({ value: '/repo/packages/cli/src' }),
        packageJsonPath: AbsoluteFilePathStub({ value: '/repo/packages/cli/package.json' }),
      });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '## cli (6 files)',
            '  bin/ (0)',
            '  brokers/ (6) — guild/ (create/, list/)',
          ].join('\n'),
        }),
      );
    });

    it('EDGE: all folder types empty => folder types shown with (0) counts', () => {
      const proxy = architecturePackageInventoryBrokerProxy();

      proxy.setupPackage({
        packageName: 'empty-pkg',
        folders: [
          {
            name: 'bin',
            entries: [],
          },
          {
            name: 'assets',
            entries: [],
          },
        ],
      });

      const result = architecturePackageInventoryBroker({
        packageName: ContentTextStub({ value: 'empty-pkg' }),
        srcPath: AbsoluteFilePathStub({ value: '/repo/packages/empty-pkg/src' }),
        packageJsonPath: AbsoluteFilePathStub({ value: '/repo/packages/empty-pkg/package.json' }),
      });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: ['## empty-pkg (0 files)', '  assets/ (0)', '  bin/ (0)'].join('\n'),
        }),
      );
    });

    it('EDGE: depth 1 folder with mix of empty and non-empty subdirs => only non-empty subdirs in content', () => {
      const proxy = architecturePackageInventoryBrokerProxy();

      proxy.setupPackage({
        packageName: 'app',
        folders: [
          {
            name: 'contracts',
            entries: [
              { name: 'chat-entry', isDir: true },
              { name: 'empty-contract', isDir: true },
              { name: 'quest-id', isDir: true },
            ],
            subEntries: {
              'empty-contract': [],
            },
          },
        ],
      });

      const result = architecturePackageInventoryBroker({
        packageName: ContentTextStub({ value: 'app' }),
        srcPath: AbsoluteFilePathStub({ value: '/repo/packages/app/src' }),
        packageJsonPath: AbsoluteFilePathStub({ value: '/repo/packages/app/package.json' }),
      });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: ['## app (6 files)', '  contracts/ (6) — chat-entry/, quest-id/'].join('\n'),
        }),
      );
    });
  });

  describe('folder content formatting', () => {
    it('VALID: folder type with files but no subdirectories => shows file count without content summary', () => {
      const proxy = architecturePackageInventoryBrokerProxy();

      proxy.setupPackage({
        packageName: 'app',
        folders: [
          {
            name: 'guards',
            entries: [
              { name: 'is-active-guard.ts', isDir: false },
              { name: 'is-valid-guard.ts', isDir: false },
            ],
          },
        ],
      });

      const result = architecturePackageInventoryBroker({
        packageName: ContentTextStub({ value: 'app' }),
        srcPath: AbsoluteFilePathStub({ value: '/repo/packages/app/src' }),
        packageJsonPath: AbsoluteFilePathStub({ value: '/repo/packages/app/package.json' }),
      });

      expect(result).toStrictEqual(
        ContentTextStub({ value: ['## app (2 files)', '  guards/ (2)'].join('\n') }),
      );
    });
  });

  describe('alphabetical sorting', () => {
    it('VALID: folders sorted alphabetically regardless of input order', () => {
      const proxy = architecturePackageInventoryBrokerProxy();

      proxy.setupPackage({
        packageName: 'zeta',
        folders: [
          {
            name: 'widgets',
            entries: [{ name: 'app', isDir: true }],
          },
          {
            name: 'contracts',
            entries: [{ name: 'user', isDir: true }],
          },
        ],
      });

      const result = architecturePackageInventoryBroker({
        packageName: ContentTextStub({ value: 'zeta' }),
        srcPath: AbsoluteFilePathStub({ value: '/repo/packages/zeta/src' }),
        packageJsonPath: AbsoluteFilePathStub({ value: '/repo/packages/zeta/package.json' }),
      });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: ['## zeta (6 files)', '  contracts/ (3) — user/', '  widgets/ (3) — app/'].join(
            '\n',
          ),
        }),
      );
    });
  });
});
