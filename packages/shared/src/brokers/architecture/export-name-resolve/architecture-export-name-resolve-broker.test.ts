import { architectureExportNameResolveBroker } from './architecture-export-name-resolve-broker';
import { architectureExportNameResolveBrokerProxy } from './architecture-export-name-resolve-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('architectureExportNameResolveBroker', () => {
  describe('export found in source', () => {
    it('VALID: {file with export const questLoadBroker} => returns "questLoadBroker"', () => {
      const proxy = architectureExportNameResolveBrokerProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/brokers/quest/load/quest-load-broker.ts',
      });

      proxy.setupReturns({
        content: ContentTextStub({
          value: `export const questLoadBroker = () => {};`,
        }),
      });

      const result = architectureExportNameResolveBroker({ filePath });

      expect(result).toStrictEqual(ContentTextStub({ value: 'questLoadBroker' }));
    });
  });

  describe('PascalCase widget export', () => {
    it('VALID: {widget file with export const HomeContentWidget} => returns "HomeContentWidget"', () => {
      const proxy = architectureExportNameResolveBrokerProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/home-content/home-content-widget.tsx',
      });

      proxy.setupReturns({
        content: ContentTextStub({
          value: `export const HomeContentWidget = () => null;`,
        }),
      });

      const result = architectureExportNameResolveBroker({ filePath });

      expect(result).toStrictEqual(ContentTextStub({ value: 'HomeContentWidget' }));
    });
  });

  describe('source missing', () => {
    it('EDGE: {file does not exist on disk} => returns kebab basename fallback', () => {
      const proxy = architectureExportNameResolveBrokerProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/brokers/quest/load/quest-load-broker.ts',
      });

      proxy.setupMissing();

      const result = architectureExportNameResolveBroker({ filePath });

      expect(result).toStrictEqual(ContentTextStub({ value: 'quest-load-broker' }));
    });
  });

  describe('export not extractable', () => {
    it('EDGE: {file source has no export const|function} => returns kebab basename fallback', () => {
      const proxy = architectureExportNameResolveBrokerProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/brokers/quest/load/quest-load-broker.ts',
      });

      proxy.setupReturns({
        content: ContentTextStub({
          value: `// no export here\nimport { foo } from './foo';`,
        }),
      });

      const result = architectureExportNameResolveBroker({ filePath });

      expect(result).toStrictEqual(ContentTextStub({ value: 'quest-load-broker' }));
    });
  });
});
