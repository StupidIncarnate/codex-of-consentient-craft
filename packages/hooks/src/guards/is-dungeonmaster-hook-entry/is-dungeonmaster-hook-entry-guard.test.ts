import { isDungeonmasterHookEntryGuard } from './is-dungeonmaster-hook-entry-guard';
import {
  PreToolUseHookStub,
  PostToolUseHookStub,
} from '../../contracts/claude-settings/claude-settings.stub';

describe('isDungeonmasterHookEntryGuard', () => {
  it('VALID: {entry with dungeonmaster command} => returns true', () => {
    const entry = PreToolUseHookStub({
      hooks: [{ type: 'command', command: 'dungeonmaster-pre-bash' }],
    });

    const result = isDungeonmasterHookEntryGuard({ entry });

    expect(result).toBe(true);
  });

  it('VALID: {entry with non-dungeonmaster command} => returns false', () => {
    const entry = PreToolUseHookStub({
      hooks: [{ type: 'command', command: 'some-other-hook' }],
    });

    const result = isDungeonmasterHookEntryGuard({ entry });

    expect(result).toBe(false);
  });

  it('VALID: {entry with multiple hooks, one dungeonmaster} => returns true', () => {
    const entry = PreToolUseHookStub({
      hooks: [
        { type: 'command', command: 'external-hook' },
        { type: 'command', command: 'dungeonmaster-pre-edit-lint' },
      ],
    });

    const result = isDungeonmasterHookEntryGuard({ entry });

    expect(result).toBe(true);
  });

  it('EMPTY: {entry with empty hooks array} => returns false', () => {
    const entry = PreToolUseHookStub({ hooks: [] });

    const result = isDungeonmasterHookEntryGuard({ entry });

    expect(result).toBe(false);
  });

  it('EMPTY: {no entry provided} => returns false', () => {
    const result = isDungeonmasterHookEntryGuard({});

    expect(result).toBe(false);
  });

  it('VALID: {PostToolUse entry with dungeonmaster command} => returns true', () => {
    const entry = PostToolUseHookStub({
      hooks: [{ type: 'command', command: 'dungeonmaster-post-ask-question' }],
    });

    const result = isDungeonmasterHookEntryGuard({ entry });

    expect(result).toBe(true);
  });
});
