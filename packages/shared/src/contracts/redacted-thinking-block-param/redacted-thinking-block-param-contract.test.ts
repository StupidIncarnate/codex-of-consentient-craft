import { redactedThinkingBlockParamContract } from './redacted-thinking-block-param-contract';
import { RedactedThinkingBlockParamStub } from './redacted-thinking-block-param.stub';

describe('redactedThinkingBlockParamContract', () => {
  describe('valid input', () => {
    it('VALID: {type: "redacted_thinking", data: string} => returns RedactedThinkingBlockParam', () => {
      const result = RedactedThinkingBlockParamStub();

      expect(result).toStrictEqual({
        type: 'redacted_thinking',
        data: 'EncryptedThinkingDataBlob==',
      });
    });

    it('VALID: {data: ""} => accepts empty data string', () => {
      const result = redactedThinkingBlockParamContract.parse({
        type: 'redacted_thinking',
        data: '',
      });

      expect(result.data).toBe('');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {type: "thinking"} => throws wrong discriminator', () => {
      expect(() =>
        redactedThinkingBlockParamContract.parse({
          type: 'thinking',
          data: 'EncryptedBlob==',
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {data missing} => throws on missing required field', () => {
      expect(() => redactedThinkingBlockParamContract.parse({ type: 'redacted_thinking' })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {data: 123} => throws on non-string data', () => {
      expect(() =>
        redactedThinkingBlockParamContract.parse({
          type: 'redacted_thinking',
          data: 123 as never,
        }),
      ).toThrow(/Expected string/u);
    });
  });
});
