import { fileWriteCallsExtractTransformer } from './file-write-calls-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

const PROMISES_IMPORT =
  "import { appendFile, writeFile, ensureDir } from '#gateway/node/fs__promises';";

describe('fileWriteCallsExtractTransformer', () => {
  describe('appendFile', () => {
    it('VALID: {single-quoted literal path} => returns literal path', () => {
      const source = ContentTextStub({
        value: `${PROMISES_IMPORT}\nawait appendFile('/path/to/event-outbox.jsonl', line);`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { adapter: 'appendFile', filePathArg: '/path/to/event-outbox.jsonl' },
      ]);
    });

    it('VALID: {double-quoted literal path} => returns literal path', () => {
      const source = ContentTextStub({
        value: `${PROMISES_IMPORT}\nawait appendFile("/path/to/quest.jsonl", line);`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { adapter: 'appendFile', filePathArg: '/path/to/quest.jsonl' },
      ]);
    });

    it('VALID: {variable built from locationsStatics} => returns the statics reference', () => {
      const source = ContentTextStub({
        value: [
          PROMISES_IMPORT,
          'const outboxFilePath = filePathContract.parse(',
          '  join(homePath, locationsStatics.dungeonmasterHome.eventOutbox),',
          ');',
          'await appendFile(outboxFilePath, line);',
        ].join('\n'),
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          adapter: 'appendFile',
          filePathArg: '<computed: locationsStatics.dungeonmasterHome.eventOutbox>',
        },
      ]);
    });
  });

  describe('writeFile', () => {
    it('VALID: {single-quoted literal path} => returns literal path', () => {
      const source = ContentTextStub({
        value: `${PROMISES_IMPORT}\nawait writeFile('/repo/quest.json', content);`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([{ adapter: 'writeFile', filePathArg: '/repo/quest.json' }]);
    });

    it('VALID: {plain variable} => returns computed variable name', () => {
      const source = ContentTextStub({
        value: `${PROMISES_IMPORT}\nawait writeFile(tmpPath, content);`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([{ adapter: 'writeFile', filePathArg: '<computed: tmpPath>' }]);
    });
  });

  describe('ensureDir', () => {
    it('VALID: {broker-call arg} => emits computed entry', () => {
      const source = ContentTextStub({
        value: `${PROMISES_IMPORT}\nawait ensureDir(questDirBroker(questId));`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { adapter: 'ensureDir', filePathArg: '<computed: questDirBroker>' },
      ]);
    });
  });

  describe('multiple calls', () => {
    it('VALID: {two different gateway calls} => returns both', () => {
      const source = ContentTextStub({
        value: [
          PROMISES_IMPORT,
          `await appendFile('/outbox.jsonl', data);`,
          `await writeFile('/quest.json', content);`,
        ].join('\n'),
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { adapter: 'appendFile', filePathArg: '/outbox.jsonl' },
        { adapter: 'writeFile', filePathArg: '/quest.json' },
      ]);
    });

    it('VALID: {aliased import} => matches the alias and reports the gateway name', () => {
      const source = ContentTextStub({
        value:
          "import { appendFile as append } from '#gateway/node/fs__promises';\nawait append('/a.jsonl', data);",
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([{ adapter: 'appendFile', filePathArg: '/a.jsonl' }]);
    });
  });

  describe('import source', () => {
    it('EMPTY: {local writeFile from a relative import} => returns empty array', () => {
      const source = ContentTextStub({
        value: "import { writeFile } from './write-file';\nawait writeFile('/a.json', c);",
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {node:fs promises import} => returns empty array', () => {
      const source = ContentTextStub({
        value: "import { writeFile } from 'fs/promises';\nawait writeFile('/a.json', c);",
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {removed adapter names} => returns empty array', () => {
      const source = ContentTextStub({
        value: `await fsAppendFileAdapter({ filePath: '/outbox.jsonl', data });`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });

  describe('no calls', () => {
    it('EMPTY: {source with no write calls} => returns empty array', () => {
      const source = ContentTextStub({
        value: `const x = 42;`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });
});
