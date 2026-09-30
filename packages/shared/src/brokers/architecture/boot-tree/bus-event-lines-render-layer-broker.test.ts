import { busEventLinesRenderLayerBroker } from './bus-event-lines-render-layer-broker';
import { busEventLinesRenderLayerBrokerProxy } from './bus-event-lines-render-layer-broker.proxy';
import { EventBusContextStub } from '../../../contracts/event-bus-context/event-bus-context.stub';

const RESPONDER_FILE = '/repo/packages/foo/src/responders/foo/foo-responder.ts';
const OTHER_FILE = '/repo/packages/foo/src/responders/other/other-responder.ts';

describe('busEventLinesRenderLayerBroker', () => {
  describe('responder is neither emitter nor subscriber', () => {
    it('EMPTY: {context with no matching sites} => returns empty array', () => {
      busEventLinesRenderLayerBrokerProxy().setup();

      const result = busEventLinesRenderLayerBroker({
        responderFile: RESPONDER_FILE,
        eventBusContext: EventBusContextStub(),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('responder is an emitter', () => {
    it('VALID: {repeated emit of same type} => deduped to one bus→ line', () => {
      busEventLinesRenderLayerBrokerProxy().setup();

      const result = busEventLinesRenderLayerBroker({
        responderFile: RESPONDER_FILE,
        eventBusContext: EventBusContextStub({
          emitterSites: [
            {
              emitterFile: RESPONDER_FILE,
              eventType: 'chat-output',
              busExportName: 'myBus',
            },
            {
              emitterFile: RESPONDER_FILE,
              eventType: 'chat-output',
              busExportName: 'myBus',
            },
            {
              emitterFile: RESPONDER_FILE,
              eventType: 'chat-output',
              busExportName: 'myBus',
            },
          ],
        }),
      });

      expect(result.map(String)).toStrictEqual(['bus→ chat-output']);
    });

    it('VALID: {two matching emitter sites} => returns two bus→ lines in order', () => {
      busEventLinesRenderLayerBrokerProxy().setup();

      const result = busEventLinesRenderLayerBroker({
        responderFile: RESPONDER_FILE,
        eventBusContext: EventBusContextStub({
          emitterSites: [
            {
              emitterFile: RESPONDER_FILE,
              eventType: 'chat-output',
              busExportName: 'myBus',
            },
            {
              emitterFile: RESPONDER_FILE,
              eventType: 'chat-complete',
              busExportName: 'myBus',
            },
            {
              emitterFile: OTHER_FILE,
              eventType: 'unrelated',
              busExportName: 'myBus',
            },
          ],
        }),
      });

      expect(result.map(String)).toStrictEqual(['bus→ chat-output', 'bus→ chat-complete']);
    });
  });

  describe('responder is a subscriber', () => {
    it('VALID: {one subscriber entry} => returns one bus← line', () => {
      busEventLinesRenderLayerBrokerProxy().setup();

      const result = busEventLinesRenderLayerBroker({
        responderFile: RESPONDER_FILE,
        eventBusContext: EventBusContextStub({
          subscriberFiles: [
            {
              subscriberFile: RESPONDER_FILE,
              busExportName: 'myBus',
            },
          ],
        }),
      });

      expect(result.map(String)).toStrictEqual(['bus← myBus (subscribes all event types)']);
    });

    it('VALID: {duplicate subscriber entries for same bus} => deduped to one line', () => {
      busEventLinesRenderLayerBrokerProxy().setup();

      const result = busEventLinesRenderLayerBroker({
        responderFile: RESPONDER_FILE,
        eventBusContext: EventBusContextStub({
          subscriberFiles: [
            {
              subscriberFile: RESPONDER_FILE,
              busExportName: 'myBus',
            },
            {
              subscriberFile: RESPONDER_FILE,
              busExportName: 'myBus',
            },
          ],
        }),
      });

      expect(result.map(String)).toStrictEqual(['bus← myBus (subscribes all event types)']);
    });
  });

  describe('responder is both emitter and subscriber', () => {
    it('VALID: {emit + subscribe} => bus→ lines first, then bus← summary', () => {
      busEventLinesRenderLayerBrokerProxy().setup();

      const result = busEventLinesRenderLayerBroker({
        responderFile: RESPONDER_FILE,
        eventBusContext: EventBusContextStub({
          emitterSites: [
            {
              emitterFile: RESPONDER_FILE,
              eventType: 'chat-output',
              busExportName: 'myBus',
            },
          ],
          subscriberFiles: [
            {
              subscriberFile: RESPONDER_FILE,
              busExportName: 'myBus',
            },
          ],
        }),
      });

      expect(result.map(String)).toStrictEqual([
        'bus→ chat-output',
        'bus← myBus (subscribes all event types)',
      ]);
    });
  });
});
