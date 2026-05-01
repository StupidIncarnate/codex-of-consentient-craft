import { adapterImportsFindLayerBroker } from './adapter-imports-find-layer-broker';
import { adapterImportsFindLayerBrokerProxy } from './adapter-imports-find-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('adapterImportsFindLayerBroker', () => {
  describe('regular adapters', () => {
    it('VALID: {responder with adapter import} => returns adapter with isWsSubscriber false', () => {
      const proxy = adapterImportsFindLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });

      proxy.setupSource({
        content: ContentTextStub({
          value: `import { honoServeAdapter } from '../../../adapters/hono/serve/hono-serve-adapter';`,
        }),
      });

      const result = adapterImportsFindLayerBroker({ sourceFile, packageSrcPath });

      expect(result).toStrictEqual([
        {
          filePath: AbsoluteFilePathStub({
            value: '/repo/packages/server/src/adapters/hono/serve/hono-serve-adapter.ts',
          }),
          isWsSubscriber: false,
        },
      ]);
    });
  });

  describe('WS subscriber adapters', () => {
    it('VALID: {responder with EventsOn adapter} => returns adapter with isWsSubscriber true', () => {
      const proxy = adapterImportsFindLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });

      proxy.setupSource({
        content: ContentTextStub({
          value: `import { orchestratorEventsOnAdapter } from '../../../adapters/orchestrator/events-on/orchestrator-events-on-adapter';`,
        }),
      });

      const result = adapterImportsFindLayerBroker({ sourceFile, packageSrcPath });

      expect(result).toStrictEqual([
        {
          filePath: AbsoluteFilePathStub({
            value:
              '/repo/packages/server/src/adapters/orchestrator/events-on/orchestrator-events-on-adapter.ts',
          }),
          isWsSubscriber: true,
        },
      ]);
    });
  });

  describe('missing source file', () => {
    it('EMPTY: {missing responder file} => returns empty array', () => {
      const proxy = adapterImportsFindLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/missing/missing-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });

      proxy.setupMissing();

      const result = adapterImportsFindLayerBroker({ sourceFile, packageSrcPath });

      expect(result).toStrictEqual([]);
    });
  });
});
