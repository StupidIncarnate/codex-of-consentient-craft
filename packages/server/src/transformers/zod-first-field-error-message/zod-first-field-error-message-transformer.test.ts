
import { z } from '#gateway/npm/zod';

import { zodFirstFieldErrorMessageTransformer } from './zod-first-field-error-message-transformer';

describe('zodFirstFieldErrorMessageTransformer', () => {
  describe('the named field carries an issue', () => {
    it("VALID: {field: 'images', an over-cap array} => returns that field's own message", () => {
      const zodIssueError = new z.ZodError([
        {
          code: 'too_big',
          origin: 'array',
          maximum: 1,
          inclusive: true,
          message: 'Too big: expected array to have <=1 items',
          path: ['images'],
        },
      ]);

      const message = zodFirstFieldErrorMessageTransformer({
        error: zodIssueError,
        field: 'images',
      });

      expect(message).toBe('Too big: expected array to have <=1 items');
    });
  });

  describe('a different field carries the issue', () => {
    it("EMPTY: {field: 'images', only 'message' fails} => returns undefined", () => {
      const zodIssueError = new z.ZodError([
        {
          code: 'too_small',
          origin: 'string',
          minimum: 1,
          inclusive: true,
          message: 'String must contain at least 1 character(s)',
          path: ['message'],
        },
      ]);

      const result = zodFirstFieldErrorMessageTransformer({
        error: zodIssueError,
        field: 'images',
      });

      expect(result).toBe(undefined);
    });
  });
});
