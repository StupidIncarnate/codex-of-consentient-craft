import { architectureProjectMapHeadlineHttpBackendBroker } from './architecture-project-map-headline-http-backend-broker';
import { architectureProjectMapHeadlineHttpBackendBrokerProxy } from './architecture-project-map-headline-http-backend-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/server' });

const SERVER_STATICS = ContentTextStub({
  value: `export const apiRoutesStatics = {
  quests: {
    list: '/api/quests',
    start: '/api/quests/:questId/start',
  },
  health: { check: '/api/health' },
} as const;`,
});

const WEB_STATICS = ContentTextStub({
  value: `export const webConfigStatics = {
  api: { routes: { quests: '/api/quests', questStart: '/api/quests/:questId/start' } },
} as const;`,
});

const QUEST_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
});
const HEALTH_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/flows/health/health-flow.ts',
});
const QUEST_START_RESPONDER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts',
});
const QUEST_LIST_RESPONDER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/responders/quest/list/quest-list-responder.ts',
});
const START_QUEST_ADAPTER_PATH = AbsoluteFilePathStub({
  value:
    '/repo/packages/server/src/adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.ts',
});
const LIST_QUESTS_ADAPTER_PATH = AbsoluteFilePathStub({
  value:
    '/repo/packages/server/src/adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.ts',
});

describe('architectureProjectMapHeadlineHttpBackendBroker', () => {
  describe('empty package', () => {
    it('EMPTY: {no flows in package} => routes section says no routes found', () => {
      const proxy = architectureProjectMapHeadlineHttpBackendBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineHttpBackendBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '(no routes found in this package)')).toBe(true);
    });

    it('EMPTY: {no flows in package} => output does not contain exemplar section', () => {
      const proxy = architectureProjectMapHeadlineHttpBackendBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineHttpBackendBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.startsWith('## Detailed exemplar'))).toBe(false);
    });
  });

  describe('single-flow package', () => {
    it('VALID: {health route} => Routes section header in output', () => {
      const proxy = architectureProjectMapHeadlineHttpBackendBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: HEALTH_FLOW_PATH,
            source: ContentTextStub({
              value: "app.get('/api/health', (c) => c.json({ status: 'ok' }));",
            }),
          },
        ],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineHttpBackendBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe('## Routes — every server endpoint');
    });

    it('VALID: {health route} => flow file header present in output', () => {
      const proxy = architectureProjectMapHeadlineHttpBackendBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: HEALTH_FLOW_PATH,
            source: ContentTextStub({
              value: "app.get('/api/health', (c) => c.json({ status: 'ok' }));",
            }),
          },
        ],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineHttpBackendBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '### flows/health/health-flow.ts')).toBe(true);
    });

    it('VALID: {health route} => GET /api/health route line in code block', () => {
      const proxy = architectureProjectMapHeadlineHttpBackendBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: HEALTH_FLOW_PATH,
            source: ContentTextStub({
              value: "app.get('/api/health', (c) => c.json({ status: 'ok' }));",
            }),
          },
        ],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineHttpBackendBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'GET    /api/health')).toBe(true);
    });

    it('VALID: {route with responder} => responder folder line in output', () => {
      const proxy = architectureProjectMapHeadlineHttpBackendBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: QUEST_FLOW_PATH,
            source: ContentTextStub({
              value: `import { QuestListResponder } from '../../responders/quest/list/quest-list-responder';
app.get(apiRoutesStatics.quests.list, async (c) => { await QuestListResponder({}); });`,
            }),
          },
        ],
        responderFiles: [
          {
            path: QUEST_LIST_RESPONDER_PATH,
            source: ContentTextStub({
              value: `import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
export const QuestListResponder = async () => {};`,
            }),
          },
        ],
        adapterFiles: [
          {
            path: LIST_QUESTS_ADAPTER_PATH,
            source: ContentTextStub({
              value: `import { StartOrchestrator } from '@dungeonmaster/orchestrator';
export const orchestratorListQuestsAdapter = async () => StartOrchestrator.listQuests({});`,
            }),
          },
        ],
      });

      const result = architectureProjectMapHeadlineHttpBackendBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '  → responders/quest/list')).toBe(true);
      expect(lines.some((l) => l === '  → adapters/orchestrator/list-quests')).toBe(true);
    });
  });

  describe('multi-flow package', () => {
    it('VALID: {two flows} => both flow section headers present', () => {
      const proxy = architectureProjectMapHeadlineHttpBackendBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: QUEST_FLOW_PATH,
            source: ContentTextStub({
              value: 'app.get(apiRoutesStatics.quests.list, async (c) => {});',
            }),
          },
          {
            path: HEALTH_FLOW_PATH,
            source: ContentTextStub({
              value: "app.get('/api/health', (c) => {});",
            }),
          },
        ],
        responderFiles: [],
        adapterFiles: [],
      });

      const result = architectureProjectMapHeadlineHttpBackendBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '### flows/quest/quest-flow.ts')).toBe(true);
      expect(lines.some((l) => l === '### flows/health/health-flow.ts')).toBe(true);
    });
  });

  describe('detailed exemplar', () => {
    it('VALID: {POST /api/quests/:questId/start present} => exemplar header line in output', () => {
      const proxy = architectureProjectMapHeadlineHttpBackendBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: QUEST_FLOW_PATH,
            source: ContentTextStub({
              value: `import { QuestStartResponder } from '../../responders/quest/start/quest-start-responder';
app.post(apiRoutesStatics.quests.start, async (c) => {});`,
            }),
          },
        ],
        responderFiles: [
          {
            path: QUEST_START_RESPONDER_PATH,
            source: ContentTextStub({
              value: `import { orchestratorStartQuestAdapter } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter';
export const QuestStartResponder = async () => {};`,
            }),
          },
        ],
        adapterFiles: [
          {
            path: START_QUEST_ADAPTER_PATH,
            source: ContentTextStub({
              value: `import { StartOrchestrator } from '@dungeonmaster/orchestrator';
export const orchestratorStartQuestAdapter = async ({ questId }) => StartOrchestrator.startQuest({ questId });`,
            }),
          },
        ],
      });

      const result = architectureProjectMapHeadlineHttpBackendBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === '## Detailed exemplar — `POST /api/quests/:questId/start`'),
      ).toBe(true);
    });

    it('VALID: {start route exemplar} => BOUNDARY box top-left corner line present', () => {
      const proxy = architectureProjectMapHeadlineHttpBackendBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: QUEST_FLOW_PATH,
            source: ContentTextStub({
              value: `import { QuestStartResponder } from '../../responders/quest/start/quest-start-responder';
app.post(apiRoutesStatics.quests.start, async (c) => {});`,
            }),
          },
        ],
        responderFiles: [
          {
            path: QUEST_START_RESPONDER_PATH,
            source: ContentTextStub({
              value: `import { orchestratorStartQuestAdapter } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter';
export const QuestStartResponder = async () => {};`,
            }),
          },
        ],
        adapterFiles: [
          {
            path: START_QUEST_ADAPTER_PATH,
            source: ContentTextStub({
              value: `import { StartOrchestrator } from '@dungeonmaster/orchestrator';
export const orchestratorStartQuestAdapter = async ({ questId }) => StartOrchestrator.startQuest({ questId });`,
            }),
          },
        ],
      });

      const result = architectureProjectMapHeadlineHttpBackendBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === '      ╔═══════ BOUNDARY → @dungeonmaster/orchestrator ═══════╗'),
      ).toBe(true);
    });
  });

  describe('cross-package adapter extraction', () => {
    it('VALID: {adapter wrapping StartOrchestrator.listQuests} => renders namespace call token', () => {
      const proxy = architectureProjectMapHeadlineHttpBackendBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: QUEST_FLOW_PATH,
            source: ContentTextStub({
              value: `import { QuestListResponder } from '../../responders/quest/list/quest-list-responder';
app.get(apiRoutesStatics.quests.list, async (c) => { await QuestListResponder({}); });`,
            }),
          },
        ],
        responderFiles: [
          {
            path: QUEST_LIST_RESPONDER_PATH,
            source: ContentTextStub({
              value: `import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
export const QuestListResponder = async () => {};`,
            }),
          },
        ],
        adapterFiles: [
          {
            path: LIST_QUESTS_ADAPTER_PATH,
            source: ContentTextStub({
              value: `import { StartOrchestrator } from '@dungeonmaster/orchestrator';
export const orchestratorListQuestsAdapter = async () => StartOrchestrator.listQuests({});`,
            }),
          },
        ],
      });

      const result = architectureProjectMapHeadlineHttpBackendBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '  → StartOrchestrator.listQuests({...})')).toBe(true);
    });
  });
});
