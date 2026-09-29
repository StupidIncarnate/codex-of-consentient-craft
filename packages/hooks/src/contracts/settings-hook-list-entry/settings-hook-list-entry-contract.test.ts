import { settingsHookListEntryContract } from './settings-hook-list-entry-contract';
import { SettingsHookListEntryStub } from './settings-hook-list-entry.stub';

describe('settingsHookListEntryContract', () => {
  it('VALID: {default values} => a matcher-less entry (SessionStart, SubagentStart, SubagentStop, WorktreeCreate shape)', () => {
    const result = SettingsHookListEntryStub();

    expect(result).toStrictEqual({ hooks: [{ type: 'command', command: 'their-hook' }] });
  });

  it('VALID: {matcher} => an entry with a matcher (PreToolUse, PostToolUse shape)', () => {
    const result = SettingsHookListEntryStub({ matcher: 'Write|Edit' });

    expect(result).toStrictEqual({
      matcher: 'Write|Edit',
      hooks: [{ type: 'command', command: 'their-hook' }],
    });
  });

  describe('invalid input', () => {
    it('INVALID: {hooks: missing} => throws validation error', () => {
      expect(() => {
        return settingsHookListEntryContract.parse({ matcher: 'Write' });
      }).toThrow(/Invalid input/iu);
    });

    it('INVALID: {hook command: number} => throws validation error', () => {
      expect(() => {
        return settingsHookListEntryContract.parse({ hooks: [{ type: 'command', command: 5 }] });
      }).toThrow(/Invalid input/iu);
    });
  });
});
