import { importPathToPackagePrefixTransformer } from './import-path-to-package-prefix-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';

describe('importPathToPackagePrefixTransformer', () => {
  describe('same-package', () => {
    it('VALID: {rendering and referenced in server} => returns bare symbol name', () => {
      const result = importPathToPackagePrefixTransformer({
        renderingFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts',
        }),
        referencedFilePath: AbsoluteFilePathStub({
          value:
            '/repo/packages/server/src/adapters/orchestrator/get-quest/server-orchestrator-get-quest-adapter.ts',
        }),
        symbolName: 'serverOrchestratorGetQuestAdapter',
      });

      expect(result).toBe('serverOrchestratorGetQuestAdapter');
    });

    it('VALID: {rendering and referenced both in shared, different folders} => returns bare symbol name', () => {
      const result = importPathToPackagePrefixTransformer({
        renderingFilePath: AbsoluteFilePathStub({
          value:
            '/repo/packages/shared/src/brokers/architecture/project-map/architecture-project-map-broker.ts',
        }),
        referencedFilePath: AbsoluteFilePathStub({
          value:
            '/repo/packages/shared/src/transformers/name-to-url-slug/name-to-url-slug-transformer.ts',
        }),
        symbolName: 'nameToUrlSlugTransformer',
      });

      expect(result).toBe('nameToUrlSlugTransformer');
    });
  });

  describe('cross-package', () => {
    it('VALID: {server rendering shared/brokers symbol} => returns "shared/brokers/<name>"', () => {
      const result = importPathToPackagePrefixTransformer({
        renderingFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts',
        }),
        referencedFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/shared/src/brokers/port-resolve/port-resolve-broker.ts',
        }),
        symbolName: 'portResolveBroker',
      });

      expect(result).toBe('shared/brokers/portResolveBroker');
    });

    it('VALID: {web rendering shared/contracts symbol} => returns "shared/contracts/<name>"', () => {
      const result = importPathToPackagePrefixTransformer({
        renderingFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/brokers/quest/start/quest-start-broker.ts',
        }),
        referencedFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/shared/src/contracts/quest-id/quest-id-contract.ts',
        }),
        symbolName: 'questIdContract',
      });

      expect(result).toBe('shared/contracts/questIdContract');
    });

    it('VALID: {server rendering shared/adapters symbol} => returns "shared/adapters/<name>"', () => {
      const result = importPathToPackagePrefixTransformer({
        renderingFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/responders/health/health-responder.ts',
        }),
        referencedFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/shared/src/adapters/fs/read-file/fs-read-file-adapter.ts',
        }),
        symbolName: 'fsReadFileAdapter',
      });

      expect(result).toBe('shared/adapters/fsReadFileAdapter');
    });

    it('VALID: {server rendering shared/transformers symbol} => returns "shared/transformers/<name>"', () => {
      const result = importPathToPackagePrefixTransformer({
        renderingFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/responders/health/health-responder.ts',
        }),
        referencedFilePath: AbsoluteFilePathStub({
          value:
            '/repo/packages/shared/src/transformers/name-to-url-slug/name-to-url-slug-transformer.ts',
        }),
        symbolName: 'nameToUrlSlugTransformer',
      });

      expect(result).toBe('shared/transformers/nameToUrlSlugTransformer');
    });

    it('VALID: {web rendering shared/statics symbol} => returns "shared/statics/<name>"', () => {
      const result = importPathToPackagePrefixTransformer({
        renderingFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/app/app-widget.tsx',
        }),
        referencedFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/shared/src/statics/web-config/web-config-statics.ts',
        }),
        symbolName: 'webConfigStatics',
      });

      expect(result).toBe('shared/statics/webConfigStatics');
    });

    it('VALID: {orchestrator rendering server/brokers symbol} => returns "server/brokers/<name>"', () => {
      const result = importPathToPackagePrefixTransformer({
        renderingFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/orchestrator/src/brokers/quest/run/quest-run-broker.ts',
        }),
        referencedFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/brokers/port-find/port-find-broker.ts',
        }),
        symbolName: 'portFindBroker',
      });

      expect(result).toBe('server/brokers/portFindBroker');
    });
  });

  describe('out-of-bounds', () => {
    it('ERROR: {referenced path outside packages/<pkg>/src/} => throws', () => {
      expect(() =>
        importPathToPackagePrefixTransformer({
          renderingFilePath: AbsoluteFilePathStub({
            value: '/repo/packages/server/src/responders/health/health-responder.ts',
          }),
          referencedFilePath: AbsoluteFilePathStub({
            value: '/repo/node_modules/zod/lib/index.js',
          }),
          symbolName: 'z',
        }),
      ).toThrow(/file path is not under any packages\/<pkg>\/src\//u);
    });

    it('ERROR: {rendering path outside packages/<pkg>/src/} => throws', () => {
      expect(() =>
        importPathToPackagePrefixTransformer({
          renderingFilePath: AbsoluteFilePathStub({
            value: '/repo/scripts/check.ts',
          }),
          referencedFilePath: AbsoluteFilePathStub({
            value: '/repo/packages/shared/src/brokers/port-resolve/port-resolve-broker.ts',
          }),
          symbolName: 'portResolveBroker',
        }),
      ).toThrow(/file path is not under any packages\/<pkg>\/src\//u);
    });

    it('ERROR: {file directly under packages/<pkg>/src with no folder type} => throws', () => {
      expect(() =>
        importPathToPackagePrefixTransformer({
          renderingFilePath: AbsoluteFilePathStub({
            value: '/repo/packages/server/src/responders/health/health-responder.ts',
          }),
          referencedFilePath: AbsoluteFilePathStub({
            value: '/repo/packages/shared/src/index.ts',
          }),
          symbolName: 'foo',
        }),
      ).toThrow(/file path is not under any packages\/<pkg>\/src\//u);
    });
  });
});
