import { architectureProjectMapHeadlineMcpServerBroker } from './architecture-project-map-headline-mcp-server-broker';
import { architectureProjectMapHeadlineMcpServerBrokerProxy } from './architecture-project-map-headline-mcp-server-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineMcpServerStatics } from '../../../statics/project-map-headline-mcp-server/project-map-headline-mcp-server-statics';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/mcp' });

const ARCH_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/mcp/src/flows/architecture/architecture-flow.ts',
});
const QUEST_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/mcp/src/flows/quest/quest-flow.ts',
});

const ARCH_FLOW_SOURCE = ContentTextStub({
  value: `export const ArchitectureFlow = (): ToolRegistration[] => [
  {
    name: 'discover' as never,
    description: 'Discover utilities' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) => ArchitectureHandleResponder({ tool: 'discover' as never, args }),
  },
  {
    name: 'get-architecture' as never,
    description: 'Returns complete architecture overview' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) =>
      ArchitectureHandleResponder({ tool: 'get-architecture' as never, args }),
  },
];`,
});

const QUEST_FLOW_SOURCE = ContentTextStub({
  value: `export const QuestFlow = (): ToolRegistration[] => [
  {
    name: 'get-quest' as never,
    description: 'Get a quest' as never,
    inputSchema: questSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest' as never, args }),
  },
];`,
});

describe('architectureProjectMapHeadlineMcpServerBroker', () => {
  describe('empty package', () => {
    it('EMPTY: {no flows in package} => tools section says no tools found', () => {
      const proxy = architectureProjectMapHeadlineMcpServerBrokerProxy();

      proxy.setup({ flowFiles: [], responderFiles: [], adapterFiles: [] });

      const result = architectureProjectMapHeadlineMcpServerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '(no tools found in this package)')).toBe(true);
    });

    it('EMPTY: {no flows in package} => output does not contain exemplar section', () => {
      const proxy = architectureProjectMapHeadlineMcpServerBrokerProxy();

      proxy.setup({ flowFiles: [], responderFiles: [], adapterFiles: [] });

      const result = architectureProjectMapHeadlineMcpServerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '## Detailed exemplar — `discover`')).toBe(false);
    });
  });

  describe('single flow with one tool', () => {
    it('VALID: {single flow, single tool} => Tools section header in output', () => {
      const proxy = architectureProjectMapHeadlineMcpServerBrokerProxy();

      proxy.setup({
        flowFiles: [{ path: ARCH_FLOW_PATH, source: ARCH_FLOW_SOURCE }],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineMcpServerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe('## Tools — every MCP tool');
    });

    it('VALID: {single flow, two tools} => flow file header with tool count present', () => {
      const proxy = architectureProjectMapHeadlineMcpServerBrokerProxy();

      proxy.setup({
        flowFiles: [{ path: ARCH_FLOW_PATH, source: ARCH_FLOW_SOURCE }],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineMcpServerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '### flows/architecture/architecture-flow.ts (2 tools)')).toBe(
        true,
      );
    });

    it('VALID: {discover tool} => tool entry line present with handler responder', () => {
      const proxy = architectureProjectMapHeadlineMcpServerBrokerProxy();

      proxy.setup({
        flowFiles: [{ path: ARCH_FLOW_PATH, source: ARCH_FLOW_SOURCE }],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineMcpServerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      const discoverLine = `${'discover'.padEnd(projectMapHeadlineMcpServerStatics.toolNamePadWidth)} → ArchitectureHandleResponder`;

      expect(lines.some((l) => l === discoverLine)).toBe(true);
    });
  });

  describe('multi-flow package groups correctly', () => {
    it('VALID: {two flows} => architecture flow section header present', () => {
      const proxy = architectureProjectMapHeadlineMcpServerBrokerProxy();

      proxy.setup({
        flowFiles: [
          { path: ARCH_FLOW_PATH, source: ARCH_FLOW_SOURCE },
          { path: QUEST_FLOW_PATH, source: QUEST_FLOW_SOURCE },
        ],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineMcpServerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '### flows/architecture/architecture-flow.ts (2 tools)')).toBe(
        true,
      );
    });

    it('VALID: {two flows} => quest flow section header present', () => {
      const proxy = architectureProjectMapHeadlineMcpServerBrokerProxy();

      proxy.setup({
        flowFiles: [
          { path: ARCH_FLOW_PATH, source: ARCH_FLOW_SOURCE },
          { path: QUEST_FLOW_PATH, source: QUEST_FLOW_SOURCE },
        ],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineMcpServerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '### flows/quest/quest-flow.ts (1 tool)')).toBe(true);
    });

    it('VALID: {two flows} => get-quest tool entry under quest flow', () => {
      const proxy = architectureProjectMapHeadlineMcpServerBrokerProxy();

      proxy.setup({
        flowFiles: [
          { path: ARCH_FLOW_PATH, source: ARCH_FLOW_SOURCE },
          { path: QUEST_FLOW_PATH, source: QUEST_FLOW_SOURCE },
        ],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineMcpServerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      const getQuestLine = `${'get-quest'.padEnd(projectMapHeadlineMcpServerStatics.toolNamePadWidth)} → QuestHandleResponder`;

      expect(lines.some((l) => l === getQuestLine)).toBe(true);
    });
  });
});
