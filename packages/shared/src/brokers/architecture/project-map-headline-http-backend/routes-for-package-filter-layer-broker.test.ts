import { routesForPackageFilterLayerBroker } from './routes-for-package-filter-layer-broker';
import { routesForPackageFilterLayerBrokerProxy } from './routes-for-package-filter-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { HttpEdgeStub } from '../../../contracts/http-edge/http-edge.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/server' });
const OTHER_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/mcp' });

describe('routesForPackageFilterLayerBroker', () => {
  describe('empty edges', () => {
    it('EMPTY: {no edges} => returns empty array', () => {
      routesForPackageFilterLayerBrokerProxy();

      const result = routesForPackageFilterLayerBroker({
        allEdges: [],
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edges matching the package root', () => {
    it('VALID: {edge whose serverFlowFile is under packageRoot} => returns that edge', () => {
      routesForPackageFilterLayerBrokerProxy();
      const edge = HttpEdgeStub({
        serverFlowFile: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
        }),
      });

      const result = routesForPackageFilterLayerBroker({
        allEdges: [edge],
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual([edge]);
    });
  });

  describe('edges from a different package', () => {
    it('VALID: {edge from different package} => excludes that edge', () => {
      routesForPackageFilterLayerBrokerProxy();
      const edge = HttpEdgeStub({
        serverFlowFile: AbsoluteFilePathStub({
          value: '/repo/packages/mcp/src/flows/architecture/architecture-flow.ts',
        }),
      });

      const result = routesForPackageFilterLayerBroker({
        allEdges: [edge],
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge with null serverFlowFile', () => {
    it('EDGE: {serverFlowFile: null} => excludes that edge', () => {
      routesForPackageFilterLayerBrokerProxy();
      const edge = HttpEdgeStub({
        serverFlowFile: null,
        webBrokerFile: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/brokers/quest/list/quest-list-broker.ts',
        }),
        paired: false,
      });

      const result = routesForPackageFilterLayerBroker({
        allEdges: [edge],
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('mixed edges from multiple packages', () => {
    it('VALID: {edges from server and mcp} => returns only server edges', () => {
      routesForPackageFilterLayerBrokerProxy();
      const serverEdge = HttpEdgeStub({
        serverFlowFile: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
        }),
      });
      const mcpEdge = HttpEdgeStub({
        method: ContentTextStub({ value: 'POST' }),
        urlPattern: ContentTextStub({ value: '/api/tools' }),
        serverFlowFile: AbsoluteFilePathStub({
          value: '/repo/packages/mcp/src/flows/tools/tools-flow.ts',
        }),
      });

      const result = routesForPackageFilterLayerBroker({
        allEdges: [serverEdge, mcpEdge],
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual([serverEdge]);
    });

    it('VALID: {two server edges and one mcp edge} => returns both server edges', () => {
      routesForPackageFilterLayerBrokerProxy();
      const serverEdgeA = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/quests' }),
        serverFlowFile: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
        }),
      });
      const serverEdgeB = HttpEdgeStub({
        method: ContentTextStub({ value: 'POST' }),
        urlPattern: ContentTextStub({ value: '/api/quests/:questId/start' }),
        serverFlowFile: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
        }),
      });
      const otherEdge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/health' }),
        serverFlowFile: AbsoluteFilePathStub({
          value: '/repo/packages/mcp/src/flows/health/health-flow.ts',
        }),
      });

      const result = routesForPackageFilterLayerBroker({
        allEdges: [serverEdgeA, otherEdge, serverEdgeB],
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual([serverEdgeA, serverEdgeB]);
    });

    it('VALID: {filtering against other package root} => returns only mcp edge', () => {
      routesForPackageFilterLayerBrokerProxy();
      const serverEdge = HttpEdgeStub({
        serverFlowFile: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
        }),
      });
      const mcpEdge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/tools' }),
        serverFlowFile: AbsoluteFilePathStub({
          value: '/repo/packages/mcp/src/flows/tools/tools-flow.ts',
        }),
      });

      const result = routesForPackageFilterLayerBroker({
        allEdges: [serverEdge, mcpEdge],
        packageRoot: OTHER_ROOT,
      });

      expect(result).toStrictEqual([mcpEdge]);
    });
  });
});
