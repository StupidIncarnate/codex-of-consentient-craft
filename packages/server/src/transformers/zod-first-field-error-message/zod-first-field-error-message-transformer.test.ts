import { ContentTextStub } from '@dungeonmaster/shared/contracts/content-text/content-text.stub';

import { zodFirstFieldErrorMessageTransformer } from './zod-first-field-error-message-transformer';

describe('zodFirstFieldErrorMessageTransformer', () => {
  describe('the named field carries an issue', () => {
    it("VALID: {field: 'images', an over-cap array} => returns that field's own message", () => {
      const zodIssueError = Object.assign(new Error('ignored'), {
        issues: [{ message: 'Too big: expected array to have <=1 items', path: ['images'] }],
      });

      const message = zodFirstFieldErrorMessageTransformer({
        error: zodIssueError,
        field: ContentTextStub({ value: 'images' }),
      });

      expect(message).toBe('Too big: expected array to have <=1 items');
    });
  });

  describe('a different field carries the issue', () => {
    it("EMPTY: {field: 'images', only 'message' fails} => returns undefined", () => {
      const zodIssueError = Object.assign(new Error('ignored'), {
        issues: [{ message: 'String must contain at least 1 character(s)', path: ['message'] }],
      });

      const result = zodFirstFieldErrorMessageTransformer({
        error: zodIssueError,
        field: ContentTextStub({ value: 'images' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
