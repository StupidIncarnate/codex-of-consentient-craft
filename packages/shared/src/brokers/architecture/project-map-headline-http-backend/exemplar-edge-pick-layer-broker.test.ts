import { exemplarEdgePickLayerBroker } from './exemplar-edge-pick-layer-broker';
import { exemplarEdgePickLayerBrokerProxy } from './exemplar-edge-pick-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { HttpEdgeStub } from '../../../contracts/http-edge/http-edge.stub';

const POST_START_EDGE = HttpEdgeStub({
  method: ContentTextStub({ value: 'POST' }),
  urlPattern: ContentTextStub({ value: '/api/quests/:questId/start' }),
  serverFlowFile: AbsoluteFilePathStub({
    value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
  }),
});

const GET_QUESTS_EDGE = HttpEdgeStub({
  method: ContentTextStub({ value: 'GET' }),
  urlPattern: ContentTextStub({ value: '/api/quests' }),
  serverFlowFile: AbsoluteFilePathStub({
    value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
  }),
});

const GET_HEALTH_EDGE = HttpEdgeStub({
  method: ContentTextStub({ value: 'GET' }),
  urlPattern: ContentTextStub({ value: '/api/health' }),
  serverFlowFile: AbsoluteFilePathStub({
    value: '/repo/packages/server/src/flows/health/health-flow.ts',
  }),
});

const GET_QUEST_DETAIL_EDGE = HttpEdgeStub({
  method: ContentTextStub({ value: 'GET' }),
  urlPattern: ContentTextStub({ value: '/api/quests/:questId/steps/:stepId' }),
  serverFlowFile: AbsoluteFilePathStub({
    value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
  }),
});

describe('exemplarEdgePickLayerBroker', () => {
  describe('empty edges', () => {
    it('EMPTY: {no edges} => returns null', () => {
      exemplarEdgePickLayerBrokerProxy();

      const result = exemplarEdgePickLayerBroker({ edges: [] });

      expect(result).toBe(null);
    });
  });

  describe('preferred start route present', () => {
    it('VALID: {POST /api/quests/:questId/start in list} => returns that edge', () => {
      exemplarEdgePickLayerBrokerProxy();

      const result = exemplarEdgePickLayerBroker({
        edges: [GET_QUESTS_EDGE, POST_START_EDGE, GET_HEALTH_EDGE],
      });

      expect(result).toBe(POST_START_EDGE);
    });
  });

  describe('no start route, non-trivial route present', () => {
    it('VALID: {no start route, edge with 3+ segments} => returns that non-trivial edge', () => {
      exemplarEdgePickLayerBrokerProxy();

      const result = exemplarEdgePickLayerBroker({
        edges: [GET_QUESTS_EDGE, GET_QUEST_DETAIL_EDGE],
      });

      expect(result).toBe(GET_QUEST_DETAIL_EDGE);
    });
  });

  describe('no start route, no non-trivial route', () => {
    it('VALID: {only trivial routes} => returns first edge in list', () => {
      exemplarEdgePickLayerBrokerProxy();

      const result = exemplarEdgePickLayerBroker({
        edges: [GET_HEALTH_EDGE, GET_QUESTS_EDGE],
      });

      expect(result).toBe(GET_HEALTH_EDGE);
    });
  });

  describe('single edge', () => {
    it('VALID: {single GET /api/quests edge} => returns that edge', () => {
      exemplarEdgePickLayerBrokerProxy();

      const result = exemplarEdgePickLayerBroker({ edges: [GET_QUESTS_EDGE] });

      expect(result).toBe(GET_QUESTS_EDGE);
    });
  });
});
