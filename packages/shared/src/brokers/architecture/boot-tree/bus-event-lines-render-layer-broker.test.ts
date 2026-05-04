import { busEventLinesRenderLayerBroker } from './bus-event-lines-render-layer-broker';
import { busEventLinesRenderLayerBrokerProxy } from './bus-event-lines-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { EventBusContextStub } from '../../../contracts/event-bus-context/event-bus-context.stub';

const RESPONDER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/foo/src/responders/foo/foo-responder.ts',
});
const OTHER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/foo/src/responders/other/other-responder.ts',
});

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
              eventType: ContentTextStub({ value: 'chat-output' }),
              busExportName: ContentTextStub({ value: 'myBus' }),
            },
            {
              emitterFile: RESPONDER_FILE,
              eventType: ContentTextStub({ value: 'chat-output' }),
              busExportName: ContentTextStub({ value: 'myBus' }),
            },
            {
              emitterFile: RESPONDER_FILE,
              eventType: ContentTextStub({ value: 'chat-output' }),
              busExportName: ContentTextStub({ value: 'myBus' }),
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
              eventType: ContentTextStub({ value: 'chat-output' }),
              busExportName: ContentTextStub({ value: 'myBus' }),
            },
            {
              emitterFile: RESPONDER_FILE,
              eventType: ContentTextStub({ value: 'chat-complete' }),
              busExportName: ContentTextStub({ value: 'myBus' }),
            },
            {
              emitterFile: OTHER_FILE,
              eventType: ContentTextStub({ value: 'unrelated' }),
              busExportName: ContentTextStub({ value: 'myBus' }),
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
              busExportName: ContentTextStub({ value: 'myBus' }),
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
              busExportName: ContentTextStub({ value: 'myBus' }),
            },
            {
              subscriberFile: RESPONDER_FILE,
              busExportName: ContentTextStub({ value: 'myBus' }),
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
              eventType: ContentTextStub({ value: 'chat-output' }),
              busExportName: ContentTextStub({ value: 'myBus' }),
            },
          ],
          subscriberFiles: [
            {
              subscriberFile: RESPONDER_FILE,
              busExportName: ContentTextStub({ value: 'myBus' }),
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
