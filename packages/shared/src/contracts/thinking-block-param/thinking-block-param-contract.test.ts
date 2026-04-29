import { thinkingBlockParamContract } from './thinking-block-param-contract';
import { ThinkingBlockParamStub } from './thinking-block-param.stub';

describe('thinkingBlockParamContract', () => {
  describe('valid input', () => {
    it('VALID: {type: "thinking", thinking: string} => returns ThinkingBlockParam', () => {
      const result = ThinkingBlockParamStub();

      expect(result).toStrictEqual({
        type: 'thinking',
        thinking: 'Let me reason through this problem step by step...',
      });
    });

    it('VALID: {type: "thinking", thinking, signature} => includes optional signature', () => {
      const result = thinkingBlockParamContract.parse({
        type: 'thinking',
        thinking: 'My reasoning...',
        signature: 'sig_abc123',
      });

      expect(result).toStrictEqual({
        type: 'thinking',
        thinking: 'My reasoning...',
        signature: 'sig_abc123',
      });
    });

    it('VALID: {thinking: ""} => accepts empty thinking string', () => {
      const result = thinkingBlockParamContract.parse({
        type: 'thinking',
        thinking: '',
      });

      expect(result.thinking).toBe('');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {type: "text"} => throws wrong discriminator', () => {
      expect(() =>
        thinkingBlockParamContract.parse({ type: 'text', thinking: 'some reasoning' }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {thinking missing} => throws on missing required field', () => {
      expect(() => thinkingBlockParamContract.parse({ type: 'thinking' })).toThrow(/Required/u);
    });

    it('INVALID: {thinking: 123} => throws on non-string thinking', () => {
      expect(() =>
        thinkingBlockParamContract.parse({ type: 'thinking', thinking: 123 as never }),
      ).toThrow(/Expected string/u);
    });
  });
});
