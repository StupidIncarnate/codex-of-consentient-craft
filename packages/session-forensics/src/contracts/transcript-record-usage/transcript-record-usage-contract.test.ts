import { transcriptRecordUsageContract } from './transcript-record-usage-contract';
import { TranscriptRecordUsageStub } from './transcript-record-usage.stub';

describe('transcriptRecordUsageContract', () => {
  describe('valid usage', () => {
    it('VALID: {all five keys} => parses each count', () => {
      const usage = TranscriptRecordUsageStub({
        input_tokens: 2,
        output_tokens: 239,
        cache_read_input_tokens: 14_500_661,
        cache_creation_input_tokens: 32_335,
        output_tokens_details: { thinking_tokens: 51_539 },
      });

      const result = transcriptRecordUsageContract.parse(usage);

      expect(result).toStrictEqual({
        input_tokens: 2,
        output_tokens: 239,
        cache_read_input_tokens: 14_500_661,
        cache_creation_input_tokens: 32_335,
        output_tokens_details: { thinking_tokens: 51_539 },
      });
    });

    it('VALID: {default stub} => parses the two default counts only', () => {
      const result = transcriptRecordUsageContract.parse(TranscriptRecordUsageStub());

      expect(result).toStrictEqual({ input_tokens: 2, output_tokens: 239 });
    });

    it('EMPTY: {} => parses with every key absent', () => {
      const result = transcriptRecordUsageContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('EMPTY: {output_tokens_details: {}} => parses with thinking_tokens absent', () => {
      const result = transcriptRecordUsageContract.parse({ output_tokens_details: {} });

      expect(result).toStrictEqual({ output_tokens_details: {} });
    });

    it('EDGE: {unknown keys} => drops the keys the contract does not list', () => {
      const result = transcriptRecordUsageContract.parse({
        input_tokens: 2,
        service_tier: 'standard',
        cache_creation: { ephemeral_5m_input_tokens: 32_335 },
      });

      expect(result).toStrictEqual({ input_tokens: 2 });
    });
  });

  describe('invalid usage', () => {
    it('INVALID: {input_tokens: "2"} => throws on the string count', () => {
      expect(() => transcriptRecordUsageContract.parse({ input_tokens: '2' })).toThrow(
        /expected number/u,
      );
    });

    it('INVALID: {output_tokens_details: 5} => throws on the non-object details', () => {
      expect(() => transcriptRecordUsageContract.parse({ output_tokens_details: 5 })).toThrow(
        /expected object/u,
      );
    });
  });
});
