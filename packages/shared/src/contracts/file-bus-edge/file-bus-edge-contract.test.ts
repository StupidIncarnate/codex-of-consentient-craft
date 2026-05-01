import { fileBusEdgeContract } from './file-bus-edge-contract';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

describe('fileBusEdgeContract', () => {
  describe('parse', () => {
    it('VALID: {full paired edge} => parses successfully', () => {
      const result = fileBusEdgeContract.parse({
        filePath: ContentTextStub({ value: '/repo/.dungeonmaster/quests/quest.jsonl' }),
        writerFile: AbsoluteFilePathStub({
          value:
            '/repo/packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.ts',
        }),
        watcherFile: AbsoluteFilePathStub({
          value:
            '/repo/packages/server/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts',
        }),
        paired: true,
      });

      expect(result).toStrictEqual({
        filePath: '/repo/.dungeonmaster/quests/quest.jsonl',
        writerFile:
          '/repo/packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.ts',
        watcherFile:
          '/repo/packages/server/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts',
        paired: true,
      });
    });

    it('VALID: {null watcherFile, paired=false} => parses successfully', () => {
      const result = fileBusEdgeContract.parse({
        filePath: ContentTextStub({ value: '/repo/.dungeonmaster/quests/quest.jsonl' }),
        writerFile: AbsoluteFilePathStub({
          value:
            '/repo/packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.ts',
        }),
        watcherFile: null,
        paired: false,
      });

      expect(result).toStrictEqual({
        filePath: '/repo/.dungeonmaster/quests/quest.jsonl',
        writerFile:
          '/repo/packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.ts',
        watcherFile: null,
        paired: false,
      });
    });

    it('VALID: {null writerFile, paired=false} => parses successfully', () => {
      const result = fileBusEdgeContract.parse({
        filePath: ContentTextStub({ value: '/repo/.dungeonmaster/quests/quest.jsonl' }),
        writerFile: null,
        watcherFile: AbsoluteFilePathStub({
          value:
            '/repo/packages/server/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts',
        }),
        paired: false,
      });

      expect(result).toStrictEqual({
        filePath: '/repo/.dungeonmaster/quests/quest.jsonl',
        writerFile: null,
        watcherFile:
          '/repo/packages/server/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts',
        paired: false,
      });
    });

    it('VALID: {computed path reference} => parses successfully', () => {
      const result = fileBusEdgeContract.parse({
        filePath: ContentTextStub({ value: '<computed: questPathBroker>' }),
        writerFile: AbsoluteFilePathStub({
          value:
            '/repo/packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.ts',
        }),
        watcherFile: null,
        paired: false,
      });

      expect(result).toStrictEqual({
        filePath: '<computed: questPathBroker>',
        writerFile:
          '/repo/packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.ts',
        watcherFile: null,
        paired: false,
      });
    });
  });
});
