import { commentCountContract } from './comment-count-contract';
import { CommentCountStub } from './comment-count.stub';

describe('commentCountContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => returns 0', () => {
      const result = CommentCountStub({ value: 0 });

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => returns 5', () => {
      const result = CommentCountStub({ value: 5 });

      expect(result).toBe(5);
    });

    it('VALID: {value: 2} => returns a valid CommentCount branded number', () => {
      const result = commentCountContract.parse(2);

      expect(result).toBe(2);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -1} => throws for negative count', () => {
      expect(() => CommentCountStub({ value: -1 as never })).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => CommentCountStub({ value: 1.5 as never })).toThrow(
        /Expected integer, received float/u,
      );
    });

    it('INVALID: {value: "x"} => throws for non-number', () => {
      expect(() => CommentCountStub({ value: 'x' as never })).toThrow(
        /Expected number, received string/u,
      );
    });
  });
});
