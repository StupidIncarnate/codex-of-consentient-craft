import { architectureProjectMapHeadlineProgrammaticServiceBroker } from './architecture-project-map-headline-programmatic-service-broker';
import { architectureProjectMapHeadlineProgrammaticServiceBrokerProxy } from './architecture-project-map-headline-programmatic-service-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineProgrammaticServiceStatics } from '../../../statics/project-map-headline-programmatic-service/project-map-headline-programmatic-service-statics';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });

const STARTUP_SOURCE = ContentTextStub({
  value: `export const StartOrchestrator = {
  listGuilds: async (): Promise<GuildListItem[]> => GuildFlow.list(),
  startQuest: async ({ questId }: { questId: QuestId }): Promise<ProcessId> =>
    OrchestrationFlow.start({ questId }),
};`,
});

const WS_EMIT_SOURCE = ContentTextStub({
  value: "orchestrationEventsState.emit({ type: 'chat-output', payload });",
});

const WS_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
});

describe('architectureProjectMapHeadlineProgrammaticServiceBroker', () => {
  describe('empty package', () => {
    it('EMPTY: {no startup file} => API section shows empty notice', () => {
      const proxy = architectureProjectMapHeadlineProgrammaticServiceBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineProgrammaticServiceBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineProgrammaticServiceStatics.apiSectionEmpty),
      ).toBe(true);
    });

    it('EMPTY: {no startup file} => Events section shows empty notice', () => {
      const proxy = architectureProjectMapHeadlineProgrammaticServiceBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineProgrammaticServiceBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineProgrammaticServiceStatics.eventsSectionEmpty),
      ).toBe(true);
    });

    it('EMPTY: {no startup file} => State writes section shows empty notice', () => {
      const proxy = architectureProjectMapHeadlineProgrammaticServiceBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineProgrammaticServiceBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) => l === projectMapHeadlineProgrammaticServiceStatics.stateWritesSectionEmpty,
        ),
      ).toBe(true);
    });
  });

  describe('API method extraction', () => {
    it('VALID: {startup with listGuilds and startQuest} => API section header present', () => {
      const proxy = architectureProjectMapHeadlineProgrammaticServiceBrokerProxy();

      proxy.setup({
        startupFileName: 'start-orchestrator.ts',
        startupSource: STARTUP_SOURCE,
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineProgrammaticServiceBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe('## Public API (StartOrchestrator.*)');
    });

    it('VALID: {startup with listGuilds} => Guilds domain label present in API section', () => {
      const proxy = architectureProjectMapHeadlineProgrammaticServiceBrokerProxy();

      proxy.setup({
        startupFileName: 'start-orchestrator.ts',
        startupSource: STARTUP_SOURCE,
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineProgrammaticServiceBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.startsWith('Guilds:'))).toBe(true);
    });

    it('VALID: {startup with startQuest} => Orchestration domain label present', () => {
      const proxy = architectureProjectMapHeadlineProgrammaticServiceBrokerProxy();

      proxy.setup({
        startupFileName: 'start-orchestrator.ts',
        startupSource: STARTUP_SOURCE,
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineProgrammaticServiceBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.startsWith('Orchestration:'))).toBe(true);
    });
  });

  describe('event bus emissions', () => {
    it('VALID: {source file with emit call} => event type appears in events section', () => {
      const proxy = architectureProjectMapHeadlineProgrammaticServiceBrokerProxy();

      proxy.setup({
        startupFileName: 'start-orchestrator.ts',
        startupSource: STARTUP_SOURCE,
        sourceFiles: [{ path: WS_FILE, source: WS_EMIT_SOURCE }],
      });

      const result = architectureProjectMapHeadlineProgrammaticServiceBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === "'chat-output'")).toBe(true);
    });
  });

  describe('detailed exemplar', () => {
    it('VALID: {startup with methods} => exemplar section header present', () => {
      const proxy = architectureProjectMapHeadlineProgrammaticServiceBrokerProxy();

      proxy.setup({
        startupFileName: 'start-orchestrator.ts',
        startupSource: STARTUP_SOURCE,
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineProgrammaticServiceBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) =>
          l.startsWith(projectMapHeadlineProgrammaticServiceStatics.exemplarSectionPrefix),
        ),
      ).toBe(true);
    });

    it('VALID: {startup with listGuilds as first method} => exemplar is for listGuilds', () => {
      const proxy = architectureProjectMapHeadlineProgrammaticServiceBrokerProxy();

      proxy.setup({
        startupFileName: 'start-orchestrator.ts',
        startupSource: STARTUP_SOURCE,
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineProgrammaticServiceBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) =>
            l ===
            `${projectMapHeadlineProgrammaticServiceStatics.exemplarSectionPrefix}listGuilds${projectMapHeadlineProgrammaticServiceStatics.exemplarSectionSuffix}`,
        ),
      ).toBe(true);
    });
  });

  describe('section separators', () => {
    it('VALID: {startup with methods} => sections separated by horizontal rule', () => {
      const proxy = architectureProjectMapHeadlineProgrammaticServiceBrokerProxy();

      proxy.setup({
        startupFileName: 'start-orchestrator.ts',
        startupSource: STARTUP_SOURCE,
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineProgrammaticServiceBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '---')).toBe(true);
    });
  });
});
