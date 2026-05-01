import { fsWatchTailCallsExtractTransformer } from './fs-watch-tail-calls-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('fsWatchTailCallsExtractTransformer', () => {
  describe('literal path detection', () => {
    it('VALID: {single-quoted literal path} => returns filePathArg with that path', () => {
      const result = fsWatchTailCallsExtractTransformer({
        source: ContentTextStub({
          value:
            "fsWatchTailAdapter({ filePath: '/repo/.dungeonmaster/quests/quest.jsonl', onLine });",
        }),
      });

      expect(result).toStrictEqual([{ filePathArg: '/repo/.dungeonmaster/quests/quest.jsonl' }]);
    });

    it('VALID: {double-quoted literal path} => returns filePathArg with that path', () => {
      const result = fsWatchTailCallsExtractTransformer({
        source: ContentTextStub({
          value:
            'fsWatchTailAdapter({ filePath: "/repo/.dungeonmaster/quests/quest.jsonl", onLine });',
        }),
      });

      expect(result).toStrictEqual([{ filePathArg: '/repo/.dungeonmaster/quests/quest.jsonl' }]);
    });

    it('VALID: {backtick-quoted literal path} => returns filePathArg with that path', () => {
      const result = fsWatchTailCallsExtractTransformer({
        source: ContentTextStub({
          value:
            'fsWatchTailAdapter({ filePath: `/repo/.dungeonmaster/quests/quest.jsonl`, onLine });',
        }),
      });

      expect(result).toStrictEqual([{ filePathArg: '/repo/.dungeonmaster/quests/quest.jsonl' }]);
    });
  });

  describe('computed path detection', () => {
    it('VALID: {broker invocation as filePath} => returns <computed: brokerName>', () => {
      const result = fsWatchTailCallsExtractTransformer({
        source: ContentTextStub({
          value: 'fsWatchTailAdapter({ filePath: questPathBroker(questId), onLine });',
        }),
      });

      expect(result).toStrictEqual([{ filePathArg: '<computed: questPathBroker>' }]);
    });

    it('VALID: {bare variable as filePath} => returns <computed: varName>', () => {
      const result = fsWatchTailCallsExtractTransformer({
        source: ContentTextStub({
          value: 'fsWatchTailAdapter({ filePath: outboxPath, onLine });',
        }),
      });

      expect(result).toStrictEqual([{ filePathArg: '<computed: outboxPath>' }]);
    });
  });

  describe('multiple calls', () => {
    it('VALID: {two fsWatchTailAdapter calls} => returns both entries', () => {
      const result = fsWatchTailCallsExtractTransformer({
        source: ContentTextStub({
          value: [
            "fsWatchTailAdapter({ filePath: '/repo/a.jsonl', onLine });",
            "fsWatchTailAdapter({ filePath: '/repo/b.jsonl', onLine });",
          ].join('\n'),
        }),
      });

      expect(result).toStrictEqual([
        { filePathArg: '/repo/a.jsonl' },
        { filePathArg: '/repo/b.jsonl' },
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no fsWatchTailAdapter call} => returns empty array', () => {
      const result = fsWatchTailCallsExtractTransformer({
        source: ContentTextStub({ value: 'const x = 1;' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
