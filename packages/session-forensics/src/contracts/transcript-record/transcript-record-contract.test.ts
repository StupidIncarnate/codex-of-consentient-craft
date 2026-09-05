import { transcriptRecordContract } from './transcript-record-contract';
import { TranscriptRecordStub } from './transcript-record.stub';

describe('transcriptRecordContract', () => {
  describe('valid input', () => {
    it('VALID: {assistant record, content array, usage} => returns the branded record', () => {
      const result = transcriptRecordContract.parse({
        type: 'assistant',
        timestamp: '2026-09-01T19:09:06.542Z',
        message: {
          model: 'claude-opus-5',
          content: [
            { type: 'text', text: 'Reading the file now.' },
            { type: 'tool_use', name: 'Read', input: { file_path: '/tmp/x.ts' } },
          ],
          usage: {
            input_tokens: 2,
            output_tokens: 239,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 32_335,
          },
        },
      });

      expect(result).toStrictEqual(
        TranscriptRecordStub({
          message: {
            model: 'claude-opus-5',
            content: [
              { type: 'text', text: 'Reading the file now.' },
              { type: 'tool_use', name: 'Read', input: { file_path: '/tmp/x.ts' } },
            ],
            usage: {
              input_tokens: 2,
              output_tokens: 239,
              cache_read_input_tokens: 0,
              cache_creation_input_tokens: 32_335,
            },
          },
        }),
      );
    });

    it('VALID: {user record, bare-string content} => returns the branded record', () => {
      const result = transcriptRecordContract.parse({
        type: 'user',
        timestamp: '2026-09-01T19:10:00.000Z',
        message: { content: 'What does this function return?' },
      });

      expect(result).toStrictEqual(
        TranscriptRecordStub({
          type: 'user',
          timestamp: '2026-09-01T19:10:00.000Z',
          message: { content: 'What does this function return?' },
        }),
      );
    });

    it('VALID: {isSidechain: true, agentId} => returns the branded sub-agent record', () => {
      const result = transcriptRecordContract.parse({
        type: 'assistant',
        timestamp: '2026-09-01T19:09:06.542Z',
        isSidechain: true,
        agentId: 'acafb4083d5b6bf67',
        message: {
          model: 'claude-opus-5',
          content: [{ type: 'text', text: 'Sub-agent turn.' }],
        },
      });

      expect(result).toStrictEqual(
        TranscriptRecordStub({
          isSidechain: true,
          agentId: 'acafb4083d5b6bf67',
          message: {
            model: 'claude-opus-5',
            content: [{ type: 'text', text: 'Sub-agent turn.' }],
          },
        }),
      );
    });
  });

  describe('absent optional fields', () => {
    it('EMPTY: {only type} => returns a record with every other field absent', () => {
      const result = transcriptRecordContract.parse({ type: 'attachment' });

      expect(result).toStrictEqual({ type: 'attachment' });
    });

    it('EMPTY: {no timestamp} => returns the record without a timestamp field', () => {
      const result = transcriptRecordContract.parse({
        type: 'assistant',
        message: {
          model: 'claude-opus-5',
          content: [{ type: 'text', text: 'On it.' }],
        },
      });

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          model: 'claude-opus-5',
          content: [{ type: 'text', text: 'On it.' }],
        },
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {missing type} => throws', () => {
      expect(() => transcriptRecordContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {type: number} => throws', () => {
      expect(() => TranscriptRecordStub({ type: 123 as never })).toThrow(/received number/u);
    });
  });
});
