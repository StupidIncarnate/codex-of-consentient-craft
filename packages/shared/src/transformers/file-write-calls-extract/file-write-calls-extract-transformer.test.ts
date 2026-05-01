import { fileWriteCallsExtractTransformer } from './file-write-calls-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('fileWriteCallsExtractTransformer', () => {
  describe('fsAppendFileAdapter', () => {
    it('VALID: {filePath with single-quoted literal} => returns literal path', () => {
      const source = ContentTextStub({
        value: `await fsAppendFileAdapter({ filePath: '/path/to/event-outbox.jsonl', data: line });`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { adapter: 'fsAppendFileAdapter', filePathArg: '/path/to/event-outbox.jsonl' },
      ]);
    });

    it('VALID: {filePath with double-quoted literal} => returns literal path', () => {
      const source = ContentTextStub({
        value: `await fsAppendFileAdapter({ filePath: "/path/to/quest.jsonl", data: line });`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { adapter: 'fsAppendFileAdapter', filePathArg: '/path/to/quest.jsonl' },
      ]);
    });
  });

  describe('fsWriteFileAdapter', () => {
    it('VALID: {filePath with single-quoted literal} => returns literal path', () => {
      const source = ContentTextStub({
        value: `await fsWriteFileAdapter({ filePath: '/repo/quest.json', content });`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { adapter: 'fsWriteFileAdapter', filePathArg: '/repo/quest.json' },
      ]);
    });
  });

  describe('fsMkdirAdapter', () => {
    it('VALID: {filePath with broker-call arg} => emits computed entry', () => {
      const source = ContentTextStub({
        value: `await fsMkdirAdapter({ filePath: questDirBroker(questId) });`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { adapter: 'fsMkdirAdapter', filePathArg: '<computed: questDirBroker>' },
      ]);
    });
  });

  describe('multiple calls', () => {
    it('VALID: {two different adapter calls} => returns both', () => {
      const source = ContentTextStub({
        value: [
          `await fsAppendFileAdapter({ filePath: '/outbox.jsonl', data });`,
          `await fsWriteFileAdapter({ filePath: '/quest.json', content });`,
        ].join('\n'),
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { adapter: 'fsAppendFileAdapter', filePathArg: '/outbox.jsonl' },
        { adapter: 'fsWriteFileAdapter', filePathArg: '/quest.json' },
      ]);
    });
  });

  describe('no calls', () => {
    it('EMPTY: {source with no fs adapter calls} => returns empty array', () => {
      const source = ContentTextStub({
        value: `const x = 42;`,
      });

      const result = fileWriteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });
});
