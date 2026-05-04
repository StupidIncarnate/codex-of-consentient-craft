import { architectureEventBusBroker } from './architecture-event-bus-broker';
import { architectureEventBusBrokerProxy } from './architecture-event-bus-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const STATE_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/foo/src/state/my-bus/my-bus-state.ts',
});
const EMITTER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/foo/src/responders/emitter/emitter-responder.ts',
});
const SUBSCRIBER_ADAPTER = AbsoluteFilePathStub({
  value: '/repo/packages/bar/src/adapters/foo/events-on/foo-events-on-adapter.ts',
});
const GATEWAY_RESPONDER = AbsoluteFilePathStub({
  value: '/repo/packages/bar/src/responders/server/init/server-init-responder.ts',
});

describe('architectureEventBusBroker', () => {
  describe('no source files', () => {
    it('EMPTY: {no buses anywhere} => returns empty context', () => {
      const proxy = architectureEventBusBrokerProxy();
      proxy.setup({ sourceFiles: [] });

      const result = architectureEventBusBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual({
        buses: [],
        emitterSites: [],
        subscriberFiles: [],
      });
    });
  });

  describe('full bus discovery end-to-end', () => {
    it('VALID: {state + emitter + subscriber adapter + gateway} => returns combined context', () => {
      const proxy = architectureEventBusBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: STATE_FILE,
            source: ContentTextStub({
              value:
                'export const myBus = { emit: ({ type }) => {}, on: ({ type, handler }) => {} };',
            }),
          },
          {
            path: EMITTER_FILE,
            source: ContentTextStub({
              value: "myBus.emit({ type: 'chat-output', payload });",
            }),
          },
          {
            path: SUBSCRIBER_ADAPTER,
            source: ContentTextStub({
              value: 'myBus.on({ type, handler });',
            }),
          },
          {
            path: GATEWAY_RESPONDER,
            source: ContentTextStub({
              value:
                "import { fooEventsOnAdapter } from '../../../adapters/foo/events-on/foo-events-on-adapter';",
            }),
          },
        ],
      });

      const result = architectureEventBusBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual({
        buses: [
          {
            stateFile: STATE_FILE,
            exportName: ContentTextStub({ value: 'myBus' }),
          },
        ],
        emitterSites: [
          {
            emitterFile: EMITTER_FILE,
            eventType: ContentTextStub({ value: 'chat-output' }),
            busExportName: ContentTextStub({ value: 'myBus' }),
          },
        ],
        subscriberFiles: [
          {
            subscriberFile: GATEWAY_RESPONDER,
            busExportName: ContentTextStub({ value: 'myBus' }),
          },
        ],
      });
    });
  });
});
