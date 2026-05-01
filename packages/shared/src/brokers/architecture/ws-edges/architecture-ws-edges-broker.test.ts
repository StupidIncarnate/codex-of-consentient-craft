import { architectureWsEdgesBroker } from './architecture-ws-edges-broker';
import { architectureWsEdgesBrokerProxy } from './architecture-ws-edges-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const EMIT_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
});
const CONSUME_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/adapters/orchestrator/events-on/events-on-adapter.ts',
});

describe('architectureWsEdgesBroker', () => {
  describe('no source files', () => {
    it('EMPTY: {no files} => returns empty array', () => {
      const proxy = architectureWsEdgesBrokerProxy();
      proxy.setup({ sourceFiles: [] });

      const result = architectureWsEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('emitter and consumer present', () => {
    it('VALID: {emit + consume same type} => returns paired edge', () => {
      const proxy = architectureWsEdgesBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: EMIT_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', payload });",
            }),
          },
          {
            path: CONSUME_FILE,
            source: ContentTextStub({
              value: "if (parsed.data.type === 'chat-output') {",
            }),
          },
        ],
      });

      const result = architectureWsEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          eventType: ContentTextStub({ value: 'chat-output' }),
          emitterFile: EMIT_FILE,
          consumerFiles: [CONSUME_FILE],
          paired: true,
        },
      ]);
    });

    it('VALID: {emitter only, no consumer} => returns unpaired edge', () => {
      const proxy = architectureWsEdgesBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: EMIT_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'slot-update', payload });",
            }),
          },
        ],
      });

      const result = architectureWsEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          eventType: ContentTextStub({ value: 'slot-update' }),
          emitterFile: EMIT_FILE,
          consumerFiles: [],
          paired: false,
        },
      ]);
    });
  });
});
