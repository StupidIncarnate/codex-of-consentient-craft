import { busSubscriberFilesFindLayerBroker } from './bus-subscriber-files-find-layer-broker';
import { busSubscriberFilesFindLayerBrokerProxy } from './bus-subscriber-files-find-layer-broker.proxy';
import { EventBusStub } from '../../../contracts/event-bus/event-bus.stub';

const PROJECT_ROOT = '/repo';
const STATE_FILE = '/repo/packages/foo/src/state/my-bus/my-bus-state.ts';
const SUBSCRIBER_ADAPTER = '/repo/packages/bar/src/adapters/foo/events-on/foo-events-on-adapter.ts';
const GATEWAY_RESPONDER = '/repo/packages/bar/src/responders/server/init/server-init-responder.ts';
const UNRELATED_RESPONDER = '/repo/packages/bar/src/responders/other/other-responder.ts';

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
            source: 'myBus.on({ type, handler });',
          },
          {
            path: GATEWAY_RESPONDER,
            source:
              "import { fooEventsOnAdapter } from '../../../adapters/foo/events-on/foo-events-on-adapter';",
          },
        ],
      });

      const result = busSubscriberFilesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        buses: [
          EventBusStub({
            stateFile: STATE_FILE,
            exportName: 'myBus',
          }),
        ],
      });

      expect(result).toStrictEqual([
        {
          subscriberFile: GATEWAY_RESPONDER,
          busExportName: 'myBus',
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
            source: 'myBus.on({ type, handler });',
          },
        ],
      });

      const result = busSubscriberFilesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        buses: [
          EventBusStub({
            stateFile: STATE_FILE,
            exportName: 'myBus',
          }),
        ],
      });

      expect(result).toStrictEqual([
        {
          subscriberFile: GATEWAY_RESPONDER,
          busExportName: 'myBus',
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
            source: 'export const otherResponder = () => {};',
          },
        ],
      });

      const result = busSubscriberFilesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        buses: [
          EventBusStub({
            stateFile: STATE_FILE,
            exportName: 'myBus',
          }),
        ],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
