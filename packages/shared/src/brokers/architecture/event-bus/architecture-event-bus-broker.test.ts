import { architectureEventBusBroker } from './architecture-event-bus-broker';
import { architectureEventBusBrokerProxy } from './architecture-event-bus-broker.proxy';

const PROJECT_ROOT = '/repo';
const STATE_FILE = '/repo/packages/foo/src/state/my-bus/my-bus-state.ts';
const EMITTER_FILE = '/repo/packages/foo/src/responders/emitter/emitter-responder.ts';
const SUBSCRIBER_ADAPTER = '/repo/packages/bar/src/adapters/foo/events-on/foo-events-on-adapter.ts';
const GATEWAY_RESPONDER = '/repo/packages/bar/src/responders/server/init/server-init-responder.ts';

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
            source: 'export const myBus = { emit: ({ type }) => {}, on: ({ type, handler }) => {} };',
          },
          {
            path: EMITTER_FILE,
            source: "myBus.emit({ type: 'chat-output', payload });",
          },
          {
            path: SUBSCRIBER_ADAPTER,
            source: 'myBus.on({ type, handler });',
          },
          {
            path: GATEWAY_RESPONDER,
            source: "import { fooEventsOnAdapter } from '../../../adapters/foo/events-on/foo-events-on-adapter';",
          },
        ],
      });

      const result = architectureEventBusBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual({
        buses: [
          {
            stateFile: STATE_FILE,
            exportName: 'myBus',
          },
        ],
        emitterSites: [
          {
            emitterFile: EMITTER_FILE,
            eventType: 'chat-output',
            busExportName: 'myBus',
          },
        ],
        subscriberFiles: [
          {
            subscriberFile: GATEWAY_RESPONDER,
            busExportName: 'myBus',
          },
        ],
      });
    });
  });
});
