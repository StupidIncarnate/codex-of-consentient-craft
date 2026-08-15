import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { commandLineToChatEntryTransformer } from './command-line-to-chat-entry-transformer';

const FIXED_UUID = 'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b';
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

describe('commandLineToChatEntryTransformer', () => {
  describe('command output lines', () => {
    it('VALID: {line: a ward status line} => returns an assistant-text ChatEntry carrying it verbatim', () => {
      registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(FIXED_UUID);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);

      const result = commandLineToChatEntryTransformer({
        line: 'lint  @dungeonmaster/web  PASS  878 files, 878 discovered (31.6s)',
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'lint  @dungeonmaster/web  PASS  878 files, 878 discovered (31.6s)',
        uuid: FIXED_UUID,
        timestamp: FIXED_TIMESTAMP,
      });
    });

    // The second command role's output is shaped by the same call — the transformer is indifferent
    // to which process produced the line, which is why there is one of these and not two.
    it('VALID: {line: a riftcarver carve banner} => returns the same assistant-text ChatEntry shape', () => {
      registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(FIXED_UUID);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);

      const result = commandLineToChatEntryTransformer({
        line: '— git worktree add /repo/worktrees/add-auth-a1b2c3d4 (branch quest/add-auth-a1b2c3d4) —',
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content:
          '— git worktree add /repo/worktrees/add-auth-a1b2c3d4 (branch quest/add-auth-a1b2c3d4) —',
        uuid: FIXED_UUID,
        timestamp: FIXED_TIMESTAMP,
      });
    });

    it('EDGE: {line: ""} => still returns an entry, so a blank command line is not silently dropped', () => {
      registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(FIXED_UUID);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);

      const result = commandLineToChatEntryTransformer({ line: '' });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: '',
        uuid: FIXED_UUID,
        timestamp: FIXED_TIMESTAMP,
      });
    });

    it('VALID: {line: ANSI-coloured output} => preserves the escape codes for the renderer', () => {
      registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(FIXED_UUID);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);

      const result = commandLineToChatEntryTransformer({ line: '[32mPASS[0m' });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: '[32mPASS[0m',
        uuid: FIXED_UUID,
        timestamp: FIXED_TIMESTAMP,
      });
    });
  });
});
