import { zodIssueErrorContract } from './zod-issue-error-contract';
import { ZodIssueErrorStub } from './zod-issue-error.stub';

describe('zodIssueErrorContract', () => {
  describe('valid input', () => {
    it('VALID: {issues: one message/path pair} => parses successfully', () => {
      const value = ZodIssueErrorStub({ issues: [{ message: 'received undefined', path: ['a'] }] });

      const result = zodIssueErrorContract.parse(value);

      expect(result).toStrictEqual({ issues: [{ message: 'received undefined', path: ['a'] }] });
    });

    it('VALID: {issues: two entries, one with a numeric path segment} => keeps every issue', () => {
      const value = ZodIssueErrorStub({
        issues: [
          { message: 'received undefined', path: ['a'] },
          { message: "Unrecognized key(s) in object: 'bogus'", path: ['steps', 0] },
        ],
      });

      const result = zodIssueErrorContract.parse(value);

      expect(result).toStrictEqual({
        issues: [
          { message: 'received undefined', path: ['a'] },
          { message: "Unrecognized key(s) in object: 'bogus'", path: ['steps', 0] },
        ],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {issues: []} => throws on the empty array', () => {
      expect(() => zodIssueErrorContract.parse({ issues: [] })).toThrow(
        /"message": "Too small: expected array to have >=1 items"/u,
      );
    });

    it('EMPTY: {missing issues} => throws Required', () => {
      expect(() => zodIssueErrorContract.parse({})).toThrow(/received undefined/u);
    });

    it('EMPTY: {a plain Error with no issues field} => throws Required', () => {
      expect(() => zodIssueErrorContract.parse(new Error('boom'))).toThrow(/received undefined/u);
    });
  });
});
