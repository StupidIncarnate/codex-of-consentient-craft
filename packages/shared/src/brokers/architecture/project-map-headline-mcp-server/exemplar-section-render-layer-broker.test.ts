import { exemplarSectionRenderLayerBroker } from './exemplar-section-render-layer-broker';
import { exemplarSectionRenderLayerBrokerProxy } from './exemplar-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineMcpServerStatics } from '../../../statics/project-map-headline-mcp-server/project-map-headline-mcp-server-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/mcp' });

const TOOL_NAME = ContentTextStub({ value: 'discover' });
const HANDLER_RESPONDER = ContentTextStub({ value: 'ArchitectureHandleResponder' });

describe('exemplarSectionRenderLayerBroker', () => {
  describe('responder file not readable', () => {
    it('EMPTY: {responder file missing} => output still contains tool entry and handler line', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        toolName: TOOL_NAME,
        handlerResponder: HANDLER_RESPONDER,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === `## Detailed exemplar — \`discover\``)).toBe(true);
      expect(lines.some((l) => l === '  → ArchitectureHandleResponder')).toBe(true);
    });

    it('EMPTY: {responder file missing} => output starts with exemplar section prefix', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        toolName: TOOL_NAME,
        handlerResponder: HANDLER_RESPONDER,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(
        `${projectMapHeadlineMcpServerStatics.exemplarSectionPrefix}discover${projectMapHeadlineMcpServerStatics.exemplarSectionSuffix}`,
      );
    });

    it('EMPTY: {responder file missing} => output contains MCP tool entry line', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        toolName: TOOL_NAME,
        handlerResponder: HANDLER_RESPONDER,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'MCP tool: discover')).toBe(true);
    });

    it('EMPTY: {responder file missing} => output contains fenced code block', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        toolName: TOOL_NAME,
        handlerResponder: HANDLER_RESPONDER,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.filter((l) => l === '```').length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('responder file readable with single adapter import', () => {
    it('VALID: {responder with single adapter import} => output contains adapter folder entry', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();

      proxy.setupImplementation({
        fn: () =>
          ContentTextStub({
            value: `import { sharedDiscoverAdapter } from '../../../adapters/shared/discover/shared-discover-adapter';
export const ArchitectureHandleResponder = async ({ tool, args }) => {
  return sharedDiscoverAdapter({ tool, args });
};`,
          }),
      });

      const result = exemplarSectionRenderLayerBroker({
        toolName: TOOL_NAME,
        handlerResponder: HANDLER_RESPONDER,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '      → adapters/shared/discover')).toBe(true);
    });
  });
});
