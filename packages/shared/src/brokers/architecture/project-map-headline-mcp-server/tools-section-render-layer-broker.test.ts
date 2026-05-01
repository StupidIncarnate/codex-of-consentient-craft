import { toolsSectionRenderLayerBroker } from './tools-section-render-layer-broker';
import { toolsSectionRenderLayerBrokerProxy } from './tools-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineMcpServerStatics } from '../../../statics/project-map-headline-mcp-server/project-map-headline-mcp-server-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/mcp' });

const ARCH_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/mcp/src/flows/architecture/architecture-flow.ts',
});

const SINGLE_TOOL_FLOW_SOURCE = ContentTextStub({
  value: `export const ArchitectureFlow = (): ToolRegistration[] => [
  {
    name: 'discover' as never,
    description: 'Discover utilities' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) => ArchitectureHandleResponder({ tool: 'discover' as never, args }),
  },
];`,
});

const MULTI_TOOL_FLOW_SOURCE = ContentTextStub({
  value: `export const ArchitectureFlow = (): ToolRegistration[] => [
  {
    name: 'discover' as never,
    description: 'A' as never,
    inputSchema: s as never,
    handler: async ({ args }) => ArchitectureHandleResponder({ tool: 'discover' as never, args }),
  },
  {
    name: 'get-architecture' as never,
    description: 'B' as never,
    inputSchema: s as never,
    handler: async ({ args }) =>
      ArchitectureHandleResponder({ tool: 'get-architecture' as never, args }),
  },
];`,
});

describe('toolsSectionRenderLayerBroker', () => {
  describe('no flow files', () => {
    it('EMPTY: {flowFiles: []} => returns header and empty message', () => {
      toolsSectionRenderLayerBrokerProxy();

      const result = toolsSectionRenderLayerBroker({
        flowFiles: [],
        packageRoot: PACKAGE_ROOT,
      });

      expect(String(result)).toBe(
        `${projectMapHeadlineMcpServerStatics.toolsSectionHeader}\n\n${projectMapHeadlineMcpServerStatics.toolsSectionEmpty}`,
      );
    });
  });

  describe('flow file with no tool names in source', () => {
    it('EMPTY: {flow source has no name entries} => returns empty message', () => {
      const proxy = toolsSectionRenderLayerBrokerProxy();

      proxy.setupImplementation({
        fn: () => ContentTextStub({ value: 'export const SomeFlow = () => [];' }),
      });

      const result = toolsSectionRenderLayerBroker({
        flowFiles: [ARCH_FLOW_PATH],
        packageRoot: PACKAGE_ROOT,
      });

      expect(String(result)).toBe(
        `${projectMapHeadlineMcpServerStatics.toolsSectionHeader}\n\n${projectMapHeadlineMcpServerStatics.toolsSectionEmpty}`,
      );
    });
  });

  describe('single flow with one tool', () => {
    it('VALID: {single flow, single tool} => output starts with tools section header', () => {
      const proxy = toolsSectionRenderLayerBrokerProxy();

      proxy.setupImplementation({ fn: () => SINGLE_TOOL_FLOW_SOURCE });

      const result = toolsSectionRenderLayerBroker({
        flowFiles: [ARCH_FLOW_PATH],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineMcpServerStatics.toolsSectionHeader);
    });

    it('VALID: {single flow, single tool} => flow file header shows singular tool count', () => {
      const proxy = toolsSectionRenderLayerBrokerProxy();

      proxy.setupImplementation({ fn: () => SINGLE_TOOL_FLOW_SOURCE });

      const result = toolsSectionRenderLayerBroker({
        flowFiles: [ARCH_FLOW_PATH],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '### flows/architecture/architecture-flow.ts (1 tool)')).toBe(
        true,
      );
    });

    it('VALID: {discover tool} => tool entry line with padded name and handler', () => {
      const proxy = toolsSectionRenderLayerBrokerProxy();

      proxy.setupImplementation({ fn: () => SINGLE_TOOL_FLOW_SOURCE });

      const result = toolsSectionRenderLayerBroker({
        flowFiles: [ARCH_FLOW_PATH],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');
      const expectedLine = `${'discover'.padEnd(projectMapHeadlineMcpServerStatics.toolNamePadWidth)} → ArchitectureHandleResponder`;

      expect(lines.some((l) => l === expectedLine)).toBe(true);
    });
  });

  describe('single flow with multiple tools', () => {
    it('VALID: {two tools} => flow file header shows plural tool count', () => {
      const proxy = toolsSectionRenderLayerBrokerProxy();

      proxy.setupImplementation({ fn: () => MULTI_TOOL_FLOW_SOURCE });

      const result = toolsSectionRenderLayerBroker({
        flowFiles: [ARCH_FLOW_PATH],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '### flows/architecture/architecture-flow.ts (2 tools)')).toBe(
        true,
      );
    });

    it('VALID: {two tools} => second tool entry present', () => {
      const proxy = toolsSectionRenderLayerBrokerProxy();

      proxy.setupImplementation({ fn: () => MULTI_TOOL_FLOW_SOURCE });

      const result = toolsSectionRenderLayerBroker({
        flowFiles: [ARCH_FLOW_PATH],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');
      const expectedLine = `${'get-architecture'.padEnd(projectMapHeadlineMcpServerStatics.toolNamePadWidth)} → ArchitectureHandleResponder`;

      expect(lines.some((l) => l === expectedLine)).toBe(true);
    });
  });
});
