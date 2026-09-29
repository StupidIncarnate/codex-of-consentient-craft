import { z } from '#gateway/npm/zod';
import { ContentTextStub } from '@dungeonmaster/shared/contracts/content-text/content-text.stub';

import { enumFlagParseTransformer } from './enum-flag-parse-transformer';

describe('enumFlagParseTransformer', () => {
  describe('a value the parse callback accepts', () => {
    it('VALID: {raw: "video"} => returns the parsed value', () => {
      const result = enumFlagParseTransformer({
        flag: '--kind',
        raw: ContentTextStub({ value: 'video' }),
        options: ['video', 'shot', 'transcript', 'log'],
        parse: (value) => value,
      });

      expect(result).toBe('video');
    });
  });

  describe('a ZodError throw for a value outside the enum', () => {
    it('INVALID: {raw: "nope"} => throws naming the flag, every accepted option, and the exact text typed', () => {
      const zodIssueError = new z.ZodError([
        {
          code: 'custom',
          message:
            "Invalid enum value. Expected 'video' | 'shot' | 'transcript' | 'log', received 'nope'",
          path: [],
        },
      ]);

      expect(() =>
        enumFlagParseTransformer({
          flag: '--kind',
          raw: ContentTextStub({ value: 'nope' }),
          options: ['video', 'shot', 'transcript', 'log'],
          parse: (): never => {
            throw zodIssueError;
          },
        }),
      ).toThrow(/^--kind must be one of video, shot, transcript, log; got "nope"$/u);
    });
  });

  describe('a non-Zod error', () => {
    it('ERROR: {parse throws a plain Error} => rethrows it unchanged, never wrapped with the flag', () => {
      const plainError = new Error('driver socket refused the connection');

      expect(() =>
        enumFlagParseTransformer({
          flag: '--kind',
          raw: ContentTextStub({ value: 'video' }),
          options: ['video', 'shot', 'transcript', 'log'],
          parse: (): never => {
            throw plainError;
          },
        }),
      ).toThrow(/^driver socket refused the connection$/u);
    });
  });
});
