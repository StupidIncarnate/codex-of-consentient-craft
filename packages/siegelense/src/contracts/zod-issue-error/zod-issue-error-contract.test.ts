import { zodIssueErrorContract } from './zod-issue-error-contract';
import { ZodIssueErrorStub } from './zod-issue-error.stub';

describe('zodIssueErrorContract', () => {
  describe('valid input', () => {
    it('VALID: {issues: one message/path pair} => parses successfully', () => {
      const value = ZodIssueErrorStub({ issues: [{ message: 'Required', path: ['a'] }] });

      const result = zodIssueErrorContract.parse(value);

      expect(result).toStrictEqual({ issues: [{ message: 'Required', path: ['a'] }] });
    });

    it('VALID: {issues: two entries, one with a numeric path segment} => keeps every issue', () => {
      const value = ZodIssueErrorStub({
        issues: [
          { message: 'Required', path: ['a'] },
          { message: "Unrecognized key(s) in object: 'bogus'", path: ['steps', 0] },
        ],
      });

      const result = zodIssueErrorContract.parse(value);

      expect(result).toStrictEqual({
        issues: [
          { message: 'Required', path: ['a'] },
          { message: "Unrecognized key(s) in object: 'bogus'", path: ['steps', 0] },
        ],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {issues: []} => throws on the empty array', () => {
      expect(() => zodIssueErrorContract.parse({ issues: [] })).toThrow(
        /Array must contain at least 1 element/u,
      );
    });

    it('EMPTY: {missing issues} => throws Required', () => {
      expect(() => zodIssueErrorContract.parse({})).toThrow(/Required/u);
    });

    it('EMPTY: {a plain Error with no issues field} => throws Required', () => {
      expect(() => zodIssueErrorContract.parse(new Error('boom'))).toThrow(/Required/u);
    });
  });
});
