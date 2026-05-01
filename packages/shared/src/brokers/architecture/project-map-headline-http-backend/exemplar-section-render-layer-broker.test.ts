import { exemplarSectionRenderLayerBroker } from './exemplar-section-render-layer-broker';
import { exemplarSectionRenderLayerBrokerProxy } from './exemplar-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { HttpEdgeStub } from '../../../contracts/http-edge/http-edge.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/server' });

const QUEST_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
});

const POST_START_EDGE = HttpEdgeStub({
  method: ContentTextStub({ value: 'POST' }),
  urlPattern: ContentTextStub({ value: '/api/quests/:questId/start' }),
  serverFlowFile: QUEST_FLOW_PATH,
  webBrokerFile: AbsoluteFilePathStub({
    value: '/repo/packages/web/src/brokers/quest/start/quest-start-broker.ts',
  }),
  paired: true,
});

const GET_HEALTH_EDGE = HttpEdgeStub({
  method: ContentTextStub({ value: 'GET' }),
  urlPattern: ContentTextStub({ value: '/api/health' }),
  serverFlowFile: AbsoluteFilePathStub({
    value: '/repo/packages/server/src/flows/health/health-flow.ts',
  }),
  webBrokerFile: null,
  paired: false,
});

const FLOW_SOURCE_WITH_RESPONDER = ContentTextStub({
  value: `import { QuestStartResponder } from '../../responders/quest/start/quest-start-responder';
app.post(apiRoutesStatics.quests.start, async (c) => {});`,
});

describe('exemplarSectionRenderLayerBroker', () => {
  describe('canonical start route exemplar', () => {
    it('VALID: {POST /api/quests/:questId/start, no flow source} => output contains exemplar header', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        edge: POST_START_EDGE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe('## Detailed exemplar — `POST /api/quests/:questId/start`');
    });

    it('VALID: {POST /api/quests/:questId/start, no flow source} => output contains request chain header', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        edge: POST_START_EDGE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '### Request chain')).toBe(true);
    });

    it('VALID: {POST /api/quests/:questId/start with webBrokerFile, no flow source} => output contains web broker display name', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        edge: POST_START_EDGE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'web/brokers/quest/start/quest-start-broker')).toBe(true);
    });

    it('VALID: {POST /api/quests/:questId/start, no flow source} => output contains start-quest BOUNDARY box top line', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        edge: POST_START_EDGE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === '      ╔═══════ BOUNDARY → @dungeonmaster/orchestrator ═══════╗'),
      ).toBe(true);
    });

    it('VALID: {POST start with flow source returning responder import} => output contains server flow display name', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupReturns({ content: FLOW_SOURCE_WITH_RESPONDER });

      const result = exemplarSectionRenderLayerBroker({
        edge: POST_START_EDGE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'server/flows/quest/quest-flow.ts')).toBe(true);
    });
  });

  describe('non-start route exemplar', () => {
    it('VALID: {GET /api/health, no webBrokerFile, no flow source} => output does not contain web broker line', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        edge: GET_HEALTH_EDGE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.startsWith('web/'))).toBe(false);
    });

    it('VALID: {GET /api/health, no flow source} => output contains exemplar header for health route', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        edge: GET_HEALTH_EDGE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe('## Detailed exemplar — `GET /api/health`');
    });

    it('VALID: {GET /api/health, no flow source} => output ends with closing code fence', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        edge: GET_HEALTH_EDGE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[lines.length - 1]).toBe('```');
    });
  });
});
