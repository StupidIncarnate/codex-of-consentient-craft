import { recordToContentBlocksTransformer } from './record-to-content-blocks-transformer';
import { TranscriptRecordStub } from '../../contracts/transcript-record/transcript-record.stub';

describe('recordToContentBlocksTransformer', () => {
  describe('valid input', () => {
    it('VALID: {content: array of a text and tool_use block} => returns them in order, unchanged', () => {
      const record = TranscriptRecordStub({
        message: {
          model: 'claude-opus-5',
          content: [
            { type: 'text', text: 'Reading the file now.' },
            { type: 'tool_use', name: 'Read', input: { file_path: '/tmp/x.ts' } },
          ],
        },
      });

      const result = recordToContentBlocksTransformer({ record });

      expect(result).toStrictEqual([
        { type: 'text', text: 'Reading the file now.' },
        { type: 'tool_use', name: 'Read', input: { file_path: '/tmp/x.ts' } },
      ]);
    });

    it('VALID: {content: bare string} => returns one text block carrying that string', () => {
      const record = TranscriptRecordStub({
        type: 'user',
        message: { content: 'What does this function return?' },
      });

      const result = recordToContentBlocksTransformer({ record });

      expect(result).toStrictEqual([{ type: 'text', text: 'What does this function return?' }]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no message} => returns []', () => {
      const record = TranscriptRecordStub({ type: 'attachment', message: undefined });

      const result = recordToContentBlocksTransformer({ record });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {message present, content absent} => returns []', () => {
      const record = TranscriptRecordStub({ message: { content: undefined } });

      const result = recordToContentBlocksTransformer({ record });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {content: empty array} => returns []', () => {
      const record = TranscriptRecordStub({ message: { content: [] } });

      const result = recordToContentBlocksTransformer({ record });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it("EDGE: {content: empty string} => returns one text block whose text is ''", () => {
      const record = TranscriptRecordStub({ type: 'user', message: { content: '' } });

      const result = recordToContentBlocksTransformer({ record });

      expect(result).toStrictEqual([{ type: 'text', text: '' }]);
    });

    it('EDGE: {content: single thinking block} => returns it unchanged', () => {
      const record = TranscriptRecordStub({
        message: {
          model: 'claude-opus-5',
          content: [{ type: 'thinking', thinking: 'Considering the approach.' }],
        },
      });

      const result = recordToContentBlocksTransformer({ record });

      expect(result).toStrictEqual([{ type: 'thinking', thinking: 'Considering the approach.' }]);
    });
  });
});
