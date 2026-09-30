import { tailFileCallsExtractTransformer } from './tail-file-calls-extract-transformer';

const IMPORT_LINE = "import { tailFile } from '#gateway/node/fs';";

describe('tailFileCallsExtractTransformer', () => {
  describe('literal path', () => {
    it('VALID: {single-quoted path} => returns literal', () => {
      const result = tailFileCallsExtractTransformer({
        source: `${IMPORT_LINE}\ntailFile({ path: '/repo/.dungeonmaster/quests/quest.jsonl', onLine });`,
      });

      expect(result).toStrictEqual([{ filePathArg: '/repo/.dungeonmaster/quests/quest.jsonl' }]);
    });

    it('VALID: {double-quoted path} => returns literal', () => {
      const result = tailFileCallsExtractTransformer({
        source: `${IMPORT_LINE}\ntailFile({ path: "/repo/quest.jsonl", onLine });`,
      });

      expect(result).toStrictEqual([{ filePathArg: '/repo/quest.jsonl' }]);
    });

    it('VALID: {backtick path} => returns literal', () => {
      const result = tailFileCallsExtractTransformer({
        source: `${IMPORT_LINE}\ntailFile({ path: \`/repo/quest.jsonl\`, onLine });`,
      });

      expect(result).toStrictEqual([{ filePathArg: '/repo/quest.jsonl' }]);
    });
  });

  describe('computed path', () => {
    it('VALID: {broker call as path} => returns computed broker name', () => {
      const result = tailFileCallsExtractTransformer({
        source: `${IMPORT_LINE}\ntailFile({ path: questPathBroker(questId), onLine });`,
      });

      expect(result).toStrictEqual([{ filePathArg: '<computed: questPathBroker>' }]);
    });

    it('VALID: {plain variable} => returns computed variable name', () => {
      const result = tailFileCallsExtractTransformer({
        source: `${IMPORT_LINE}\ntailFile({ path: jsonlPath, onLine });`,
      });

      expect(result).toStrictEqual([{ filePathArg: '<computed: jsonlPath>' }]);
    });

    it('VALID: {variable built from locationsStatics, path is not the first key} => returns the statics reference', () => {
      const result = tailFileCallsExtractTransformer({
        source: [
            IMPORT_LINE,
            'const outboxPath = join(homePath, locationsStatics.dungeonmasterHome.eventOutbox);',
            "tailFile({ startPosition: 'end', path: outboxPath, onLine });",
          ].join('\n'),
      });

      expect(result).toStrictEqual([
        { filePathArg: '<computed: locationsStatics.dungeonmasterHome.eventOutbox>' },
      ]);
    });
  });

  describe('import source', () => {
    it('VALID: {aliased import} => matches the alias', () => {
      const result = tailFileCallsExtractTransformer({
        source: "import { tailFile as tail } from '#gateway/node/fs';\ntail({ path: '/a.jsonl', onLine });",
      });

      expect(result).toStrictEqual([{ filePathArg: '/a.jsonl' }]);
    });

    it('EMPTY: {local tailFile from a relative import} => returns empty array', () => {
      const result = tailFileCallsExtractTransformer({
        source: "import { tailFile } from './tail-file';\ntailFile({ path: '/a.jsonl', onLine });",
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {call with no import at all} => returns empty array', () => {
      const result = tailFileCallsExtractTransformer({
        source: "tailFile({ path: '/a.jsonl', onLine });",
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {removed adapter name} => returns empty array', () => {
      const result = tailFileCallsExtractTransformer({
        source: "fsWatchTailAdapter({ filePath: '/a.jsonl', onLine });",
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('multiple calls', () => {
    it('VALID: {two tailFile calls} => returns both in source order', () => {
      const result = tailFileCallsExtractTransformer({
        source: [
            IMPORT_LINE,
            "tailFile({ path: '/repo/a.jsonl', onLine });",
            "tailFile({ path: '/repo/b.jsonl', onLine });",
          ].join('\n'),
      });

      expect(result).toStrictEqual([
        { filePathArg: '/repo/a.jsonl' },
        { filePathArg: '/repo/b.jsonl' },
      ]);
    });
  });
});
