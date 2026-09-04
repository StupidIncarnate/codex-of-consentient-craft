import { jsonlToRecordsTransformer } from './jsonl-to-records-transformer';
import { TranscriptRecordStub } from '../../contracts/transcript-record/transcript-record.stub';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

describe('jsonlToRecordsTransformer', () => {
  describe('valid input', () => {
    it('VALID: {two well-formed lines} => returns two records in order', () => {
      const lines = [
        JSON.stringify({
          type: 'assistant',
          timestamp: '2026-09-01T19:09:06.542Z',
          message: {
            model: 'claude-opus-5',
            content: [{ type: 'text', text: 'First line.' }],
          },
        }),
        JSON.stringify({
          type: 'user',
          timestamp: '2026-09-01T19:10:00.000Z',
          message: { content: 'Second line.' },
        }),
      ];

      const result = jsonlToRecordsTransformer({
        contents: ContentTextStub({ value: lines.join('\n') }),
      });

      expect(result).toStrictEqual([
        TranscriptRecordStub({
          message: {
            model: 'claude-opus-5',
            content: [{ type: 'text', text: 'First line.' }],
          },
        }),
        TranscriptRecordStub({
          type: 'user',
          timestamp: '2026-09-01T19:10:00.000Z',
          message: { content: 'Second line.' },
        }),
      ]);
    });

    it('VALID: {record with no timestamp} => still returns the record', () => {
      const line = JSON.stringify({
        type: 'user',
        message: { content: 'No timestamp on this line.' },
      });

      const result = jsonlToRecordsTransformer({ contents: ContentTextStub({ value: line }) });

      expect(result).toStrictEqual([
        { type: 'user', message: { content: 'No timestamp on this line.' } },
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {empty string} => returns no records', () => {
      const result = jsonlToRecordsTransformer({ contents: ContentTextStub({ value: '' }) });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {only newlines and spaces} => returns no records', () => {
      const result = jsonlToRecordsTransformer({
        contents: ContentTextStub({ value: '\n   \n\t\n  \n' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {trailing newline after a valid line} => returns one record', () => {
      const line = JSON.stringify({
        type: 'assistant',
        timestamp: '2026-09-01T19:09:06.542Z',
        message: {
          model: 'claude-opus-5',
          content: [{ type: 'text', text: 'Trailing newline.' }],
        },
      });

      const result = jsonlToRecordsTransformer({
        contents: ContentTextStub({ value: `${line}\n` }),
      });

      expect(result).toStrictEqual([
        TranscriptRecordStub({
          message: {
            model: 'claude-opus-5',
            content: [{ type: 'text', text: 'Trailing newline.' }],
          },
        }),
      ]);
    });

    it('EDGE: {truncated final line} => drops the broken line and returns the valid one', () => {
      const validLine = JSON.stringify({
        type: 'assistant',
        timestamp: '2026-09-01T19:09:06.542Z',
        message: {
          model: 'claude-opus-5',
          content: [{ type: 'text', text: 'Complete line.' }],
        },
      });

      const result = jsonlToRecordsTransformer({
        contents: ContentTextStub({ value: [validLine, '{"type":"assis'].join('\n') }),
      });

      expect(result).toStrictEqual([
        TranscriptRecordStub({
          message: {
            model: 'claude-opus-5',
            content: [{ type: 'text', text: 'Complete line.' }],
          },
        }),
      ]);
    });

    it('EDGE: {valid JSON that fails the contract} => drops the line', () => {
      const validLine = JSON.stringify({
        type: 'assistant',
        timestamp: '2026-09-01T19:09:06.542Z',
        message: {
          model: 'claude-opus-5',
          content: [{ type: 'text', text: 'Kept line.' }],
        },
      });

      const result = jsonlToRecordsTransformer({
        contents: ContentTextStub({ value: [validLine, JSON.stringify({ nope: 1 })].join('\n') }),
      });

      expect(result).toStrictEqual([
        TranscriptRecordStub({
          message: {
            model: 'claude-opus-5',
            content: [{ type: 'text', text: 'Kept line.' }],
          },
        }),
      ]);
    });

    it('EDGE: {blank line between two valid lines} => returns both records', () => {
      const first = JSON.stringify({
        type: 'assistant',
        timestamp: '2026-09-01T19:09:06.542Z',
        message: {
          model: 'claude-opus-5',
          content: [{ type: 'text', text: 'Before the gap.' }],
        },
      });
      const second = JSON.stringify({
        type: 'user',
        timestamp: '2026-09-01T19:10:00.000Z',
        message: { content: 'After the gap.' },
      });

      const result = jsonlToRecordsTransformer({
        contents: ContentTextStub({ value: [first, '', second].join('\n') }),
      });

      expect(result).toStrictEqual([
        TranscriptRecordStub({
          message: {
            model: 'claude-opus-5',
            content: [{ type: 'text', text: 'Before the gap.' }],
          },
        }),
        TranscriptRecordStub({
          type: 'user',
          timestamp: '2026-09-01T19:10:00.000Z',
          message: { content: 'After the gap.' },
        }),
      ]);
    });
  });
});
