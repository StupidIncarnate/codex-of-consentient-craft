import { WardErrorListStub } from './ward-error-list.stub';
import { wardErrorListContract } from './ward-error-list-contract';

describe('wardErrorListContract', () => {
  describe('valid input', () => {
    it('VALID: {value: error list string} => returns branded WardErrorList', () => {
      const result = WardErrorListStub({ value: 'src/app.ts\n  lint  no-unused-vars (line 15)' });

      expect(result).toBe('src/app.ts\n  lint  no-unused-vars (line 15)');
    });
  });

  describe('invalid input', () => {
    it('INVALID_VALUE: {value: number} => throws ZodError', () => {
      expect(() => wardErrorListContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });
});
