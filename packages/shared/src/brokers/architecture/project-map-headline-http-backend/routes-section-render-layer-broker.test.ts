import { routesSectionRenderLayerBroker } from './routes-section-render-layer-broker';
import { routesSectionRenderLayerBrokerProxy } from './routes-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { HttpEdgeStub } from '../../../contracts/http-edge/http-edge.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/server' });
const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });

const QUEST_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
});

const HEALTH_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/flows/health/health-flow.ts',
});

describe('routesSectionRenderLayerBroker', () => {
  describe('empty edges', () => {
    it('EMPTY: {no edges} => output is routes header followed by empty notice', () => {
      routesSectionRenderLayerBrokerProxy();

      const result = routesSectionRenderLayerBroker({
        edges: [],
        packageRoot: PACKAGE_ROOT,
        projectRoot: PROJECT_ROOT,
      });

      expect(String(result)).toBe(
        '## Routes — every server endpoint\n\n(no routes found in this package)',
      );
    });
  });

  describe('single flow with one edge, no flow source available', () => {
    it('VALID: {GET /api/health from health-flow, no source} => output starts with routes header', () => {
      routesSectionRenderLayerBrokerProxy();

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/health' }),
        serverFlowFile: HEALTH_FLOW_PATH,
      });

      const result = routesSectionRenderLayerBroker({
        edges: [edge],
        packageRoot: PACKAGE_ROOT,
        projectRoot: PROJECT_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe('## Routes — every server endpoint');
    });

    it('VALID: {GET /api/health from health-flow, no source} => output contains flow file name', () => {
      routesSectionRenderLayerBrokerProxy();

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/health' }),
        serverFlowFile: HEALTH_FLOW_PATH,
      });

      const result = routesSectionRenderLayerBroker({
        edges: [edge],
        packageRoot: PACKAGE_ROOT,
        projectRoot: PROJECT_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'flows/health/health-flow.ts')).toBe(true);
    });

    it('VALID: {GET /api/health from health-flow, no source} => output contains route line indented under flow', () => {
      routesSectionRenderLayerBrokerProxy();

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/health' }),
        serverFlowFile: HEALTH_FLOW_PATH,
      });

      const result = routesSectionRenderLayerBroker({
        edges: [edge],
        packageRoot: PACKAGE_ROOT,
        projectRoot: PROJECT_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '  GET    /api/health')).toBe(true);
    });
  });

  describe('two flows', () => {
    it('VALID: {quest-flow and health-flow edges, no sources} => both flow headers present', () => {
      routesSectionRenderLayerBrokerProxy();

      const questEdge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/quests' }),
        serverFlowFile: QUEST_FLOW_PATH,
      });
      const healthEdge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/health' }),
        serverFlowFile: HEALTH_FLOW_PATH,
      });

      const result = routesSectionRenderLayerBroker({
        edges: [questEdge, healthEdge],
        packageRoot: PACKAGE_ROOT,
        projectRoot: PROJECT_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'flows/quest/quest-flow.ts')).toBe(true);
      expect(lines.some((l) => l === 'flows/health/health-flow.ts')).toBe(true);
    });
  });

  describe('edge with null serverFlowFile', () => {
    it('EDGE: {edge with null serverFlowFile} => skipped, output shows no-routes notice', () => {
      routesSectionRenderLayerBrokerProxy();

      const orphanEdge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/orphan' }),
        serverFlowFile: null,
        paired: false,
      });

      const result = routesSectionRenderLayerBroker({
        edges: [orphanEdge],
        packageRoot: PACKAGE_ROOT,
        projectRoot: PROJECT_ROOT,
      });

      expect(String(result)).toBe(
        '## Routes — every server endpoint\n\n(no routes found in this package)',
      );
    });
  });
});
