import { architectureWsEdgesBroker } from './architecture-ws-edges-broker';
import { architectureWsEdgesBrokerProxy } from './architecture-ws-edges-broker.proxy';

const PROJECT_ROOT = '/repo';
const EMIT_FILE = '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts';
const CONSUME_FILE = '/repo/packages/server/src/adapters/orchestrator/events-on/events-on-adapter.ts';

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
            source: "orchestrationEventsState.emit({ type: 'chat-output', payload });",
          },
          {
            path: CONSUME_FILE,
            source: "if (parsed.data.type === 'chat-output') {",
          },
        ],
      });

      const result = architectureWsEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          eventType: 'chat-output',
          emitterFile: EMIT_FILE,
          consumerFiles: [CONSUME_FILE],
          wsGatewayFile: null,
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
            source: "orchestrationEventsState.emit({ type: 'slot-update', payload });",
          },
        ],
      });

      const result = architectureWsEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          eventType: 'slot-update',
          emitterFile: EMIT_FILE,
          consumerFiles: [],
          wsGatewayFile: null,
          paired: false,
        },
      ]);
    });
  });
});
