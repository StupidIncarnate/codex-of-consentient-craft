import { WardFileDetailStub } from './ward-file-detail.stub';
import { wardFileDetailContract } from './ward-file-detail-contract';

describe('wardFileDetailContract', () => {
  describe('valid input', () => {
    it('VALID: {value: detail string} => returns branded WardFileDetail', () => {
      const result = WardFileDetailStub({ value: 'src/app.ts\n  lint  no-unused-vars (line 15)' });

      expect(result).toBe('src/app.ts\n  lint  no-unused-vars (line 15)');
    });
  });

  describe('invalid input', () => {
    it('INVALID_VALUE: {value: number} => throws ZodError', () => {
      expect(() => wardFileDetailContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });
});
