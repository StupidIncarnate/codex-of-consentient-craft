import { tokenUsageContract } from './token-usage-contract';
import { TokenUsageStub } from './token-usage.stub';

describe('tokenUsageContract', () => {
  describe('valid input', () => {
    it('VALID: {all five counts} => returns the branded usage', () => {
      const result = tokenUsageContract.parse({
        inputTokens: 2,
        outputTokens: 239,
        cacheReadTokens: 14_500_661,
        cacheCreationTokens: 654_866,
        thinkingTokens: 51_539,
      });

      expect(result).toStrictEqual(
        TokenUsageStub({
          inputTokens: 2,
          outputTokens: 239,
          cacheReadTokens: 14_500_661,
          cacheCreationTokens: 654_866,
          thinkingTokens: 51_539,
        }),
      );
    });
  });

  describe('zero counts', () => {
    it('EDGE: {every count zero} => returns the branded usage', () => {
      const result = tokenUsageContract.parse({
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        thinkingTokens: 0,
      });

      expect(result).toStrictEqual(
        TokenUsageStub({
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          thinkingTokens: 0,
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {outputTokens: -1} => throws', () => {
      expect(() => TokenUsageStub({ outputTokens: -1 })).toThrow(
        /greater than or equal to 0|Number must be/u,
      );
    });

    it('INVALID: {inputTokens: 1.5} => throws', () => {
      expect(() => TokenUsageStub({ inputTokens: 1.5 })).toThrow(/integer/u);
    });

    it('INVALID: {cacheReadTokens: string} => throws', () => {
      expect(() => TokenUsageStub({ cacheReadTokens: '5' as never })).toThrow(/Expected number/u);
    });
  });

  describe('missing fields', () => {
    it('EMPTY: {no cacheCreationTokens} => throws', () => {
      expect(() =>
        tokenUsageContract.parse({
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          thinkingTokens: 0,
        }),
      ).toThrow(/Required/u);
    });
  });
});
