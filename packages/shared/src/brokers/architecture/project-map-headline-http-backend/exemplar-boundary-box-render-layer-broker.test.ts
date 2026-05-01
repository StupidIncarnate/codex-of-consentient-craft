import { exemplarBoundaryBoxRenderLayerBroker } from './exemplar-boundary-box-render-layer-broker';
import { exemplarBoundaryBoxRenderLayerBrokerProxy } from './exemplar-boundary-box-render-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineHttpBackendStatics } from '../../../statics/project-map-headline-http-backend/project-map-headline-http-backend-statics';

// Generic box computations for crossPackageName '@dungeonmaster/orchestrator':
// label = 'BOUNDARY → @dungeonmaster/orchestrator' (38 chars)
// note  = '(cross-package adapter call)' (29 chars)
// innerWidth = Math.max(38 + 2, 29 + 2, 56) = 56
// fill row width = 56 + 2 = 58 '═' chars
const FILL = '═'.repeat(58);
const LABEL = 'BOUNDARY → @dungeonmaster/orchestrator'.padEnd(56);
const NOTE = '(cross-package adapter call)'.padEnd(56);
const EMPTY_ROW = ''.padEnd(56);
const EXPECTED_GENERIC_BOX = [
  `      ╔${FILL}╗`,
  `      ║ ${LABEL} ║`,
  `      ║ ${EMPTY_ROW} ║`,
  `      ║ ${NOTE} ║`,
  `      ╚${FILL}╝`,
];

describe('exemplarBoundaryBoxRenderLayerBroker', () => {
  describe('canonical start route', () => {
    it('VALID: {POST /api/quests/:questId/start} => returns pre-built start-quest box', () => {
      exemplarBoundaryBoxRenderLayerBrokerProxy();
      const method = ContentTextStub({ value: 'POST' });
      const urlPattern = ContentTextStub({ value: '/api/quests/:questId/start' });
      const crossPackageName = ContentTextStub({ value: '@dungeonmaster/orchestrator' });

      const result = exemplarBoundaryBoxRenderLayerBroker({ method, urlPattern, crossPackageName });

      expect(result.map(String)).toStrictEqual(
        projectMapHeadlineHttpBackendStatics.startQuestBoundaryBox,
      );
    });

    it('VALID: {POST /api/quests/:questId/start} => first line is top-left corner of pre-built box', () => {
      exemplarBoundaryBoxRenderLayerBrokerProxy();
      const method = ContentTextStub({ value: 'POST' });
      const urlPattern = ContentTextStub({ value: '/api/quests/:questId/start' });
      const crossPackageName = ContentTextStub({ value: '@dungeonmaster/orchestrator' });

      const result = exemplarBoundaryBoxRenderLayerBroker({ method, urlPattern, crossPackageName });

      expect(String(result[0])).toBe(
        '      ╔═══════ BOUNDARY → @dungeonmaster/orchestrator ═══════╗',
      );
    });
  });

  describe('non-canonical route', () => {
    it('VALID: {GET /api/quests, crossPackageName @dungeonmaster/orchestrator} => returns generic box', () => {
      exemplarBoundaryBoxRenderLayerBrokerProxy();
      const method = ContentTextStub({ value: 'GET' });
      const urlPattern = ContentTextStub({ value: '/api/quests' });
      const crossPackageName = ContentTextStub({ value: '@dungeonmaster/orchestrator' });

      const result = exemplarBoundaryBoxRenderLayerBroker({ method, urlPattern, crossPackageName });

      expect(result.map(String)).toStrictEqual(EXPECTED_GENERIC_BOX);
    });

    it('VALID: {non-POST method with start URL} => returns generic box not pre-built box', () => {
      exemplarBoundaryBoxRenderLayerBrokerProxy();
      const method = ContentTextStub({ value: 'GET' });
      const urlPattern = ContentTextStub({ value: '/api/quests/:questId/start' });
      const crossPackageName = ContentTextStub({ value: '@dungeonmaster/orchestrator' });

      const result = exemplarBoundaryBoxRenderLayerBroker({ method, urlPattern, crossPackageName });

      expect(result.map(String)).toStrictEqual(EXPECTED_GENERIC_BOX);
    });
  });
});
