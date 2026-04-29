import { textBlockParamContract } from './text-block-param-contract';
import { TextBlockParamStub } from './text-block-param.stub';

describe('textBlockParamContract', () => {
  describe('valid input', () => {
    it('VALID: {type: "text", text: "Hello"} => returns TextBlockParam with branded fields', () => {
      const result = TextBlockParamStub({ text: 'Hello' as never });

      expect(result).toStrictEqual({
        type: 'text',
        text: 'Hello',
      });
    });

    it('VALID: {type: "text", text: "multi-line"} => returns full object', () => {
      const result = TextBlockParamStub();

      expect(result).toStrictEqual({
        type: 'text',
        text: 'Hello, how can I help you today?',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {type: "image"} => throws wrong discriminator', () => {
      expect(() => textBlockParamContract.parse({ type: 'image', text: 'Hello' })).toThrow(
        /Invalid literal value/u,
      );
    });

    it('INVALID: {type: "text", text: missing} => throws on missing required field', () => {
      expect(() => textBlockParamContract.parse({ type: 'text' })).toThrow(/Required/u);
    });

    it('INVALID: {type: "text", text: 123} => throws on non-string text', () => {
      expect(() => textBlockParamContract.parse({ type: 'text', text: 123 as never })).toThrow(
        /Expected string/u,
      );
    });
  });
});
