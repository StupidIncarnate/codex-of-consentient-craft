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
const ARCH_RESPONDER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts',
});
const SHARED_ADAPTER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/mcp/src/adapters/shared/discover/shared-discover-adapter.ts',
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

const ARCH_RESPONDER_SOURCE = ContentTextStub({
  value: `import { sharedDiscoverAdapter } from '../../../adapters/shared/discover/shared-discover-adapter';
export const ArchitectureHandleResponder = async ({ tool, args }) => {
  return sharedDiscoverAdapter({ tool, args });
};`,
});

const SHARED_ADAPTER_SOURCE = ContentTextStub({
  value: `import { StartShared } from '@dungeonmaster/shared';
export const sharedDiscoverAdapter = async ({ tool, args }) => StartShared.discover({ tool, args });`,
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

  describe('detailed exemplar', () => {
    it('VALID: {flow with tool} => exemplar section header present', () => {
      const proxy = architectureProjectMapHeadlineMcpServerBrokerProxy();

      proxy.setup({
        flowFiles: [{ path: ARCH_FLOW_PATH, source: ARCH_FLOW_SOURCE }],
        responderFiles: [{ path: ARCH_RESPONDER_PATH, source: ARCH_RESPONDER_SOURCE }],
        adapterFiles: [{ path: SHARED_ADAPTER_PATH, source: SHARED_ADAPTER_SOURCE }],
      });

      const result = architectureProjectMapHeadlineMcpServerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '## Detailed exemplar — `discover`')).toBe(true);
    });

    it('VALID: {flow with tool} => BOUNDARY box top-left corner line present', () => {
      const proxy = architectureProjectMapHeadlineMcpServerBrokerProxy();

      proxy.setup({
        flowFiles: [{ path: ARCH_FLOW_PATH, source: ARCH_FLOW_SOURCE }],
        responderFiles: [{ path: ARCH_RESPONDER_PATH, source: ARCH_RESPONDER_SOURCE }],
        adapterFiles: [{ path: SHARED_ADAPTER_PATH, source: SHARED_ADAPTER_SOURCE }],
      });

      const result = architectureProjectMapHeadlineMcpServerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) => l === '      ╔══════════════════════════════════════════════════════════╗',
        ),
      ).toBe(true);
    });
  });

  describe('cross-package adapter extraction', () => {
    it('VALID: {adapter wrapping StartShared.discover} => renders namespace call token in exemplar', () => {
      const proxy = architectureProjectMapHeadlineMcpServerBrokerProxy();

      proxy.setup({
        flowFiles: [{ path: ARCH_FLOW_PATH, source: ARCH_FLOW_SOURCE }],
        responderFiles: [{ path: ARCH_RESPONDER_PATH, source: ARCH_RESPONDER_SOURCE }],
        adapterFiles: [{ path: SHARED_ADAPTER_PATH, source: SHARED_ADAPTER_SOURCE }],
      });

      const result = architectureProjectMapHeadlineMcpServerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '            → StartShared.discover({...})')).toBe(true);
    });
  });
});
