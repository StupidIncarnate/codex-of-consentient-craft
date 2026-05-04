import { architectureBindingFlowTraceBroker } from './architecture-binding-flow-trace-broker';
import { architectureBindingFlowTraceBrokerProxy } from './architecture-binding-flow-trace-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { HttpEdgeStub } from '../../../contracts/http-edge/http-edge.stub';
import { WsEdgeStub } from '../../../contracts/ws-edge/ws-edge.stub';

const PROJECT_ROOT = '/repo';
const PACKAGE_ROOT = '/repo/packages/web';
const BINDING_NAME = 'use-quests';
const BINDING_FILE = '/repo/packages/web/src/bindings/use-quests/use-quests-binding.ts';
const BROKER_FILE = '/repo/packages/web/src/brokers/quest/quest-broker.ts';
const FLOW_FILE = '/repo/packages/server/src/flows/quest/quest-flow.ts';
const RESPONDER_FILE = '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts';
const ADAPTER_FILE =
  '/repo/packages/server/src/adapters/orchestrator/start/start-orchestrator-adapter.ts';
const EMITTER_FILE = '/repo/packages/orchestrator/src/responders/quest/quest-responder.ts';

const BINDING_SOURCE_WITH_BROKER = `import { questFetcher } from '../../brokers/quest/quest-broker';
export const useQuestsBinding = () => {};`;
const FLOW_SOURCE = `export const questFlow = () => {};`;
const RESPONDER_SOURCE = `import { StartOrchestrator } from '../../../adapters/orchestrator/start/start-orchestrator-adapter';
export const questStartResponder = async (c: Context) => {};`;
const EMITTER_SOURCE = `export const questResponder = () => {};`;

describe('architectureBindingFlowTraceBroker', () => {
  describe('binding file not found', () => {
    it('EMPTY: {missing binding file} => returns empty httpFlows and wsEvents', () => {
      architectureBindingFlowTraceBrokerProxy().setupFiles({});

      const result = architectureBindingFlowTraceBroker({
        bindingName: ContentTextStub({ value: BINDING_NAME }),
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
        projectRoot: AbsoluteFilePathStub({ value: PROJECT_ROOT }),
        httpEdges: [],
        wsEdges: [],
      });

      expect(result).toStrictEqual({ httpFlows: [], wsEvents: [] });
    });
  });

  describe('binding with HTTP edge', () => {
    it('VALID: {binding imports broker matching HTTP edge} => httpFlows has one entry', () => {
      architectureBindingFlowTraceBrokerProxy().setupFiles({
        [BINDING_FILE]: BINDING_SOURCE_WITH_BROKER,
        [FLOW_FILE]: FLOW_SOURCE,
      });

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/quests' }),
        serverFlowFile: AbsoluteFilePathStub({ value: FLOW_FILE }),
        serverResponderFile: null,
        webBrokerFile: AbsoluteFilePathStub({ value: BROKER_FILE }),
        paired: true,
      });

      const result = architectureBindingFlowTraceBroker({
        bindingName: ContentTextStub({ value: BINDING_NAME }),
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
        projectRoot: AbsoluteFilePathStub({ value: PROJECT_ROOT }),
        httpEdges: [edge],
        wsEdges: [],
      });

      expect(String(result.httpFlows[0]?.method)).toBe('GET');
      expect(String(result.httpFlows[0]?.urlPattern)).toBe('/api/quests');
    });

    it('VALID: {binding with HTTP edge and only flow file} => serverRef is back-ref to flow', () => {
      architectureBindingFlowTraceBrokerProxy().setupFiles({
        [BINDING_FILE]: BINDING_SOURCE_WITH_BROKER,
        [FLOW_FILE]: FLOW_SOURCE,
      });

      const edge = HttpEdgeStub({
        serverFlowFile: AbsoluteFilePathStub({ value: FLOW_FILE }),
        serverResponderFile: null,
        webBrokerFile: AbsoluteFilePathStub({ value: BROKER_FILE }),
        paired: true,
      });

      const result = architectureBindingFlowTraceBroker({
        bindingName: ContentTextStub({ value: BINDING_NAME }),
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
        projectRoot: AbsoluteFilePathStub({ value: PROJECT_ROOT }),
        httpEdges: [edge],
        wsEdges: [],
      });

      expect(String(result.httpFlows[0]?.serverRef)).toBe('packages/server (questFlow)');
    });

    it('VALID: {binding with HTTP edge and responder with orchestrator adapter} => orchestratorMethod and serverRef present', () => {
      architectureBindingFlowTraceBrokerProxy().setupFiles({
        [BINDING_FILE]: BINDING_SOURCE_WITH_BROKER,
        [RESPONDER_FILE]: RESPONDER_SOURCE,
        [ADAPTER_FILE]: `StartOrchestrator.startQuest({ questId })`,
      });

      const edge = HttpEdgeStub({
        serverFlowFile: AbsoluteFilePathStub({ value: FLOW_FILE }),
        serverResponderFile: AbsoluteFilePathStub({ value: RESPONDER_FILE }),
        webBrokerFile: AbsoluteFilePathStub({ value: BROKER_FILE }),
        paired: true,
      });

      const result = architectureBindingFlowTraceBroker({
        bindingName: ContentTextStub({ value: BINDING_NAME }),
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
        projectRoot: AbsoluteFilePathStub({ value: PROJECT_ROOT }),
        httpEdges: [edge],
        wsEdges: [],
      });

      expect(String(result.httpFlows[0]?.orchestratorMethod)).toBe(
        'StartOrchestrator.startQuest({...})',
      );
      expect(String(result.httpFlows[0]?.serverRef)).toBe('packages/server (questStartResponder)');
    });

    it('EMPTY: {broker import does not match any edge} => empty httpFlows', () => {
      architectureBindingFlowTraceBrokerProxy().setupFiles({
        [BINDING_FILE]: BINDING_SOURCE_WITH_BROKER,
      });

      const unrelatedEdge = HttpEdgeStub({
        webBrokerFile: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/brokers/other/other-broker.ts',
        }),
        paired: true,
      });

      const result = architectureBindingFlowTraceBroker({
        bindingName: ContentTextStub({ value: BINDING_NAME }),
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
        projectRoot: AbsoluteFilePathStub({ value: PROJECT_ROOT }),
        httpEdges: [unrelatedEdge],
        wsEdges: [],
      });

      expect(result.httpFlows).toStrictEqual([]);
    });
  });

  describe('binding with WS edge', () => {
    it('VALID: {binding file is WS consumer} => wsEvents has event type', () => {
      architectureBindingFlowTraceBrokerProxy().setupFiles({
        [BINDING_FILE]: `export const useQuestsBinding = () => {};`,
        [EMITTER_FILE]: EMITTER_SOURCE,
      });

      const wsEdge = WsEdgeStub({
        eventType: ContentTextStub({ value: 'quest-updated' }),
        emitterFile: AbsoluteFilePathStub({ value: EMITTER_FILE }),
        consumerFiles: [AbsoluteFilePathStub({ value: BINDING_FILE })],
        wsGatewayFile: null,
        paired: true,
      });

      const result = architectureBindingFlowTraceBroker({
        bindingName: ContentTextStub({ value: BINDING_NAME }),
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
        projectRoot: AbsoluteFilePathStub({ value: PROJECT_ROOT }),
        httpEdges: [],
        wsEdges: [wsEdge],
      });

      expect(String(result.wsEvents[0]?.eventType)).toBe('quest-updated');
    });

    it('VALID: {WS edge with no gateway, emitter present} => emitterRef falls back to emitter', () => {
      architectureBindingFlowTraceBrokerProxy().setupFiles({
        [BINDING_FILE]: `export const useQuestsBinding = () => {};`,
        [EMITTER_FILE]: EMITTER_SOURCE,
      });

      const wsEdge = WsEdgeStub({
        eventType: ContentTextStub({ value: 'quest-updated' }),
        emitterFile: AbsoluteFilePathStub({ value: EMITTER_FILE }),
        consumerFiles: [AbsoluteFilePathStub({ value: BINDING_FILE })],
        wsGatewayFile: null,
        paired: true,
      });

      const result = architectureBindingFlowTraceBroker({
        bindingName: ContentTextStub({ value: BINDING_NAME }),
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
        projectRoot: AbsoluteFilePathStub({ value: PROJECT_ROOT }),
        httpEdges: [],
        wsEdges: [wsEdge],
      });

      expect(String(result.wsEvents[0]?.emitterRef)).toBe('packages/orchestrator (questResponder)');
    });

    it('VALID: {WS edge with gateway file} => emitterRef is back-ref to gateway, NOT emitter', () => {
      const GATEWAY_FILE =
        '/repo/packages/server/src/responders/server/init/server-init-responder.ts';
      const GATEWAY_SOURCE = `export const ServerInitResponder = () => {};`;

      architectureBindingFlowTraceBrokerProxy().setupFiles({
        [BINDING_FILE]: `export const useQuestsBinding = () => {};`,
        [EMITTER_FILE]: EMITTER_SOURCE,
        [GATEWAY_FILE]: GATEWAY_SOURCE,
      });

      const wsEdge = WsEdgeStub({
        eventType: ContentTextStub({ value: 'quest-updated' }),
        emitterFile: AbsoluteFilePathStub({ value: EMITTER_FILE }),
        consumerFiles: [AbsoluteFilePathStub({ value: BINDING_FILE })],
        wsGatewayFile: AbsoluteFilePathStub({ value: GATEWAY_FILE }),
        paired: true,
      });

      const result = architectureBindingFlowTraceBroker({
        bindingName: ContentTextStub({ value: BINDING_NAME }),
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
        projectRoot: AbsoluteFilePathStub({ value: PROJECT_ROOT }),
        httpEdges: [],
        wsEdges: [wsEdge],
      });

      expect(String(result.wsEvents[0]?.emitterRef)).toBe('packages/server (ServerInitResponder)');
    });
  });
});
