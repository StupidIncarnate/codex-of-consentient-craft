import { resolveSpecifierLayerBroker } from './resolve-specifier-layer-broker';
import { resolveSpecifierLayerBrokerProxy } from './resolve-specifier-layer-broker.proxy';
import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';

describe('resolveSpecifierLayerBroker', () => {
  describe('relative specifiers', () => {
    it('VALID: {"./sibling", a matching .ts file} => resolves and returns its content', async () => {
      const proxy = resolveSpecifierLayerBrokerProxy();
      proxy.setupFile({
        filePath: '/repo/packages/web/src/widgets/sibling.ts',
        content: 'export const sibling = 1;',
      });

      const result = await resolveSpecifierLayerBroker({
        specifier: './sibling',
        containingFilePath: '/repo/packages/web/src/widgets/chat-widget.tsx',
        knownPackages: [],
      });

      expect(result).toStrictEqual({
        filePath: '/repo/packages/web/src/widgets/sibling.ts',
        content: 'export const sibling = 1;',
      });
    });

    it('VALID: {"./sibling", only an index.ts under a folder of that name} => resolves via the index candidate', async () => {
      const proxy = resolveSpecifierLayerBrokerProxy();
      proxy.setupMissing({
        filePath: '/repo/packages/web/src/sibling.ts',
      });
      proxy.setupMissing({
        filePath: '/repo/packages/web/src/sibling.tsx',
      });
      proxy.setupFile({
        filePath: '/repo/packages/web/src/sibling/index.ts',
        content: 'export const sibling = 1;',
      });

      const result = await resolveSpecifierLayerBroker({
        specifier: './sibling',
        containingFilePath: '/repo/packages/web/src/entry.ts',
        knownPackages: [],
      });

      expect(result).toStrictEqual({
        filePath: '/repo/packages/web/src/sibling/index.ts',
        content: 'export const sibling = 1;',
      });
    });

    it('VALID: {"../shared/foo"} => walks up a directory before resolving', async () => {
      const proxy = resolveSpecifierLayerBrokerProxy();
      proxy.setupFile({
        filePath: '/repo/packages/web/src/shared/foo.ts',
        content: 'export const foo = 1;',
      });

      const result = await resolveSpecifierLayerBroker({
        specifier: '../shared/foo',
        containingFilePath: '/repo/packages/web/src/widgets/chat-widget.tsx',
        knownPackages: [],
      });

      expect(result).toStrictEqual({
        filePath: '/repo/packages/web/src/shared/foo.ts',
        content: 'export const foo = 1;',
      });
    });
  });

  describe('bare workspace specifiers', () => {
    it('VALID: {"@dungeonmaster/node/fs", a known package} => resolves against the package folder', async () => {
      const proxy = resolveSpecifierLayerBrokerProxy();
      proxy.setupFile({
        filePath: '/repo/packages/node/fs.ts',
        content: 'export const readFile = () => {};',
      });

      const result = await resolveSpecifierLayerBroker({
        specifier: '@dungeonmaster/node/fs',
        containingFilePath: '/repo/packages/web/src/widgets/chat-widget.tsx',
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/node', path: '/repo/packages/node' }),
        ],
      });

      expect(result).toStrictEqual({
        filePath: '/repo/packages/node/fs.ts',
        content: 'export const readFile = () => {};',
      });
    });
  });

  describe('unresolvable specifiers', () => {
    it('EDGE: {"react", no known package matches} => returns undefined without reading anything', async () => {
      resolveSpecifierLayerBrokerProxy();

      const result = await resolveSpecifierLayerBroker({
        specifier: 'react',
        containingFilePath: '/repo/packages/web/src/widgets/chat-widget.tsx',
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/node', path: '/repo/packages/node' }),
        ],
      });

      expect(result).toBe(undefined);
    });

    it('EDGE: {"./missing", every candidate is absent} => returns undefined', async () => {
      const proxy = resolveSpecifierLayerBrokerProxy();
      proxy.setupMissing({
        filePath: '/repo/packages/web/src/missing.ts',
      });
      proxy.setupMissing({
        filePath: '/repo/packages/web/src/missing.tsx',
      });
      proxy.setupMissing({
        filePath: '/repo/packages/web/src/missing/index.ts',
      });
      proxy.setupMissing({
        filePath: '/repo/packages/web/src/missing/index.tsx',
      });

      const result = await resolveSpecifierLayerBroker({
        specifier: './missing',
        containingFilePath: '/repo/packages/web/src/entry.ts',
        knownPackages: [],
      });

      expect(result).toBe(undefined);
    });
  });
});
