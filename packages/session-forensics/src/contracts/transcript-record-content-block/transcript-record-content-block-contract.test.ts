import { transcriptRecordContentBlockContract } from './transcript-record-content-block-contract';
import { TranscriptRecordContentBlockStub } from './transcript-record-content-block.stub';

describe('transcriptRecordContentBlockContract', () => {
  describe('valid input', () => {
    it('VALID: {type: text, text} => returns the branded block', () => {
      const result = transcriptRecordContentBlockContract.parse({
        type: 'text',
        text: 'Reading the file now.',
      });

      expect(result).toStrictEqual(TranscriptRecordContentBlockStub());
    });

    it('VALID: {type: tool_use, name, input} => returns the branded block', () => {
      const result = transcriptRecordContentBlockContract.parse({
        type: 'tool_use',
        name: 'Read',
        input: { file_path: '/tmp/x.ts' },
      });

      expect(result).toStrictEqual({
        type: 'tool_use',
        name: 'Read',
        input: { file_path: '/tmp/x.ts' },
      });
    });

    it('VALID: {type: thinking, thinking} => returns the branded block', () => {
      const result = transcriptRecordContentBlockContract.parse({
        type: 'thinking',
        thinking: 'Considering the approach.',
      });

      expect(result).toStrictEqual({
        type: 'thinking',
        thinking: 'Considering the approach.',
      });
    });
  });

  describe('absent optional fields', () => {
    it('EMPTY: {only type} => returns a block with every other field absent', () => {
      const result = transcriptRecordContentBlockContract.parse({ type: 'tool_result' });

      expect(result).toStrictEqual({ type: 'tool_result' });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {missing type} => throws', () => {
      expect(() => transcriptRecordContentBlockContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {type: number} => throws', () => {
      expect(() => TranscriptRecordContentBlockStub({ type: 123 as never })).toThrow(
        /received number/u,
      );
    });
  });
});
