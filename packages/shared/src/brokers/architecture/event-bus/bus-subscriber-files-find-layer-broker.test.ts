import { busSubscriberFilesFindLayerBroker } from './bus-subscriber-files-find-layer-broker';
import { busSubscriberFilesFindLayerBrokerProxy } from './bus-subscriber-files-find-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { EventBusStub } from '../../../contracts/event-bus/event-bus.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const STATE_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/foo/src/state/my-bus/my-bus-state.ts',
});
const SUBSCRIBER_ADAPTER = AbsoluteFilePathStub({
  value: '/repo/packages/bar/src/adapters/foo/events-on/foo-events-on-adapter.ts',
});
const GATEWAY_RESPONDER = AbsoluteFilePathStub({
  value: '/repo/packages/bar/src/responders/server/init/server-init-responder.ts',
});
const UNRELATED_RESPONDER = AbsoluteFilePathStub({
  value: '/repo/packages/bar/src/responders/other/other-responder.ts',
});

describe('busSubscriberFilesFindLayerBroker', () => {
  describe('no buses', () => {
    it('EMPTY: {empty buses array} => returns empty array', () => {
      const proxy = busSubscriberFilesFindLayerBrokerProxy();
      proxy.setup({ sourceFiles: [] });

      const result = busSubscriberFilesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        buses: [],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('responder imports adapter that subscribes', () => {
    it('VALID: {gateway imports subscriber adapter} => responder is a subscriber', () => {
      const proxy = busSubscriberFilesFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
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

      const result = busSubscriberFilesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        buses: [
          EventBusStub({
            stateFile: STATE_FILE,
            exportName: ContentTextStub({ value: 'myBus' }),
          }),
        ],
      });

      expect(result).toStrictEqual([
        {
          subscriberFile: GATEWAY_RESPONDER,
          busExportName: ContentTextStub({ value: 'myBus' }),
        },
      ]);
    });
  });

  describe('responder calls bus.on directly', () => {
    it('VALID: {non-adapter responder calls .on() directly} => returned as subscriber', () => {
      const proxy = busSubscriberFilesFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: GATEWAY_RESPONDER,
            source: ContentTextStub({
              value: 'myBus.on({ type, handler });',
            }),
          },
        ],
      });

      const result = busSubscriberFilesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        buses: [
          EventBusStub({
            stateFile: STATE_FILE,
            exportName: ContentTextStub({ value: 'myBus' }),
          }),
        ],
      });

      expect(result).toStrictEqual([
        {
          subscriberFile: GATEWAY_RESPONDER,
          busExportName: ContentTextStub({ value: 'myBus' }),
        },
      ]);
    });
  });

  describe('unrelated responder is not a subscriber', () => {
    it('EMPTY: {responder does not call .on or import subscriber adapter} => excluded', () => {
      const proxy = busSubscriberFilesFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: UNRELATED_RESPONDER,
            source: ContentTextStub({
              value: 'export const otherResponder = () => {};',
            }),
          },
        ],
      });

      const result = busSubscriberFilesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        buses: [
          EventBusStub({
            stateFile: STATE_FILE,
            exportName: ContentTextStub({ value: 'myBus' }),
          }),
        ],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
