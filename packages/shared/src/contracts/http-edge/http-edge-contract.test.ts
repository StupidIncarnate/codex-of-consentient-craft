import { httpEdgeContract } from './http-edge-contract';
import { HttpEdgeStub } from './http-edge.stub';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

describe('httpEdgeContract', () => {
  describe('valid inputs', () => {
    it('VALID: {paired edge} => parses successfully with all fields', () => {
      const result = HttpEdgeStub({
        method: ContentTextStub({ value: 'POST' }),
        urlPattern: ContentTextStub({ value: '/api/quests/:questId/start' }),
        serverFlowFile: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
        }),
        serverResponderFile: null,
        webBrokerFile: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/brokers/quest/start/quest-start-broker.ts',
        }),
        paired: true,
      });

      expect(result).toStrictEqual({
        method: 'POST',
        urlPattern: '/api/quests/:questId/start',
        serverFlowFile: '/repo/packages/server/src/flows/quest/quest-flow.ts',
        serverResponderFile: null,
        webBrokerFile: '/repo/packages/web/src/brokers/quest/start/quest-start-broker.ts',
        paired: true,
      });
    });

    it('VALID: {orphan-server edge} => parses with null webBrokerFile', () => {
      const result = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/health' }),
        serverFlowFile: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/flows/health/health-flow.ts',
        }),
        serverResponderFile: null,
        webBrokerFile: null,
        paired: false,
      });

      expect(result).toStrictEqual({
        method: 'GET',
        urlPattern: '/api/health',
        serverFlowFile: '/repo/packages/server/src/flows/health/health-flow.ts',
        serverResponderFile: null,
        webBrokerFile: null,
        paired: false,
      });
    });

    it('VALID: {orphan-web edge} => parses with null serverFlowFile', () => {
      const result = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/sessions/:sessionId/chat/history' }),
        serverFlowFile: null,
        serverResponderFile: null,
        webBrokerFile: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/brokers/session/chat-history-broker.ts',
        }),
        paired: false,
      });

      expect(result).toStrictEqual({
        method: 'GET',
        urlPattern: '/api/sessions/:sessionId/chat/history',
        serverFlowFile: null,
        serverResponderFile: null,
        webBrokerFile: '/repo/packages/web/src/brokers/session/chat-history-broker.ts',
        paired: false,
      });
    });

    it('VALID: default stub => returns GET /api/quests paired edge', () => {
      const result = HttpEdgeStub();

      expect(result).toStrictEqual({
        method: 'GET',
        urlPattern: '/api/quests',
        serverFlowFile: '/repo/packages/server/src/flows/quest/quest-flow.ts',
        serverResponderFile: null,
        webBrokerFile: '/repo/packages/web/src/brokers/quest/list/quest-list-broker.ts',
        paired: true,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing method} => throws ZodError', () => {
      expect(() =>
        httpEdgeContract.parse({
          urlPattern: '/api/quests',
          serverFlowFile: null,
          serverResponderFile: null,
          webBrokerFile: null,
          paired: false,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing paired} => throws ZodError', () => {
      expect(() =>
        httpEdgeContract.parse({
          method: 'GET',
          urlPattern: '/api/quests',
          serverFlowFile: null,
          serverResponderFile: null,
          webBrokerFile: null,
        }),
      ).toThrow(/Required/u);
    });
  });
});
