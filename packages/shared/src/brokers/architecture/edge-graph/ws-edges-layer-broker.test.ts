import { wsEdgesLayerBroker } from './ws-edges-layer-broker';
import { wsEdgesLayerBrokerProxy } from './ws-edges-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });

const EMITTER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
});
const CONSUMER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/bindings/use-quest-chat/use-quest-chat-binding.ts',
});
const CONSUMER_FILE_2 = AbsoluteFilePathStub({
  value: '/repo/packages/web/src/bindings/use-session-replay/use-session-replay-binding.ts',
});
const PROXY_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.proxy.ts',
});
const STUB_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/shared/src/contracts/ws-message/ws-message.stub.ts',
});
const TEST_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.test.ts',
});

describe('wsEdgesLayerBroker', () => {
  describe('emitter detection', () => {
    it('VALID: {file with emit call} => detected with the literal type', () => {
      const proxy = wsEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: EMITTER_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', processId });",
            }),
          },
        ],
      });

      const result = wsEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          eventType: 'chat-output',
          emitterFile: EMITTER_FILE,
          consumerFiles: [],
          paired: false,
        },
      ]);
    });
  });

  describe('consumer detection', () => {
    it('VALID: {file with consumer branch} => detected with the literal type', () => {
      const proxy = wsEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: CONSUMER_FILE,
            source: ContentTextStub({
              value: "if (parsed.data.type === 'chat-output') { doSomething(); }",
            }),
          },
        ],
      });

      const result = wsEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          eventType: 'chat-output',
          emitterFile: null,
          consumerFiles: [CONSUMER_FILE],
          paired: false,
        },
      ]);
    });
  });

  describe('pairing', () => {
    it('VALID: {emitter + consumer for same type} => paired=true', () => {
      const proxy = wsEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: EMITTER_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', processId });",
            }),
          },
          {
            path: CONSUMER_FILE,
            source: ContentTextStub({
              value: "if (parsed.data.type === 'chat-output') { doSomething(); }",
            }),
          },
        ],
      });

      const result = wsEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          eventType: 'chat-output',
          emitterFile: EMITTER_FILE,
          consumerFiles: [CONSUMER_FILE],
          paired: true,
        },
      ]);
    });

    it('VALID: {emitter only, no consumer} => paired=false', () => {
      const proxy = wsEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: EMITTER_FILE,
            source: ContentTextStub({
              value:
                "orchestrationEventsState.emit({ type: 'execution-queue-updated', processId });",
            }),
          },
        ],
      });

      const result = wsEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          eventType: 'execution-queue-updated',
          emitterFile: EMITTER_FILE,
          consumerFiles: [],
          paired: false,
        },
      ]);
    });

    it('VALID: {consumer only, no emitter} => emitterFile=null and paired=false', () => {
      const proxy = wsEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: CONSUMER_FILE,
            source: ContentTextStub({
              value: "if (parsed.data.type === 'chat-history-complete') { done(); }",
            }),
          },
        ],
      });

      const result = wsEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          eventType: 'chat-history-complete',
          emitterFile: null,
          consumerFiles: [CONSUMER_FILE],
          paired: false,
        },
      ]);
    });
  });

  describe('multiple consumers', () => {
    it('VALID: {two consumer files for one event type} => all collected in consumerFiles[]', () => {
      const proxy = wsEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: EMITTER_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', processId });",
            }),
          },
          {
            path: CONSUMER_FILE,
            source: ContentTextStub({
              value: "if (parsed.data.type === 'chat-output') { handleChatOutput(); }",
            }),
          },
          {
            path: CONSUMER_FILE_2,
            source: ContentTextStub({
              value: "if (parsed.data.type === 'chat-output') { handleReplay(); }",
            }),
          },
        ],
      });

      const result = wsEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          eventType: 'chat-output',
          emitterFile: EMITTER_FILE,
          consumerFiles: [CONSUMER_FILE, CONSUMER_FILE_2],
          paired: true,
        },
      ]);
    });
  });

  describe('test/proxy/stub file filtering', () => {
    it('VALID: {proxy file contains emit call} => filtered out, produces no emitter', () => {
      const proxy = wsEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: PROXY_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', processId });",
            }),
          },
        ],
      });

      const result = wsEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {stub file contains consumer branch} => filtered out, produces no consumer', () => {
      const proxy = wsEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: STUB_FILE,
            source: ContentTextStub({
              value: "if (parsed.data.type === 'chat-output') { /* stub */ }",
            }),
          },
        ],
      });

      const result = wsEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {test file contains emit call} => filtered out, produces no emitter', () => {
      const proxy = wsEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: TEST_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', processId });",
            }),
          },
        ],
      });

      const result = wsEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty source files', () => {
    it('EMPTY: {no source files} => returns empty array', () => {
      const proxy = wsEdgesLayerBrokerProxy();

      proxy.setup({ sourceFiles: [] });

      const result = wsEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
