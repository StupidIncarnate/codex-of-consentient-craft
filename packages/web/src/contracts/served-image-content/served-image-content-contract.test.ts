import { servedImageContentContract } from './served-image-content-contract';
import { ServedImageContentStub } from './served-image-content.stub';

describe('servedImageContentContract', () => {
  describe('valid content', () => {
    it('VALID: {default stub} => parses text carrying a serve-route token', () => {
      const result = ServedImageContentStub();

      expect(result).toBe('Look at ![Pasted Image 1](/api/images?path=%2Fq%2Fimages%2Fa.png)');
    });

    it('VALID: {value: plain text} => parses text carrying no token at all', () => {
      const result = ServedImageContentStub({ value: 'just words' });

      expect(result).toBe('just words');
    });

    it('EMPTY: {value: ""} => parses the empty string', () => {
      const result = servedImageContentContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid content', () => {
    it('INVALID: {value: 123} => throws for a number', () => {
      expect(() => servedImageContentContract.parse(123)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => servedImageContentContract.parse(null)).toThrow(/Expected string/u);
    });
  });
});
