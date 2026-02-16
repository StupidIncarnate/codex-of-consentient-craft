import { dungeonmasterHooksCreatorTransformer } from './dungeonmaster-hooks-creator-transformer';

describe('dungeonmasterHooksCreatorTransformer', () => {
  describe('create()', () => {
    it('VALID: creates dungeonmaster hooks configuration => returns hooks object', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result).toStrictEqual({
        PreToolUse: [
          {
            matcher: 'Write|Edit|MultiEdit',
            hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }],
          },
          {
            matcher: 'Bash',
            hooks: [{ type: 'command', command: 'dungeonmaster-pre-bash' }],
          },
        ],
        SessionStart: [
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
          },
        ],
      });
    });

    it('VALID: includes PreToolUse with Write|Edit|MultiEdit matcher => returns correct matcher', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.PreToolUse[0]?.matcher).toBe('Write|Edit|MultiEdit');
    });

    it('VALID: includes PreToolUse with Bash matcher => returns correct matcher', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.PreToolUse[1]?.matcher).toBe('Bash');
    });

    it('VALID: includes dungeonmaster-pre-edit-lint command => returns correct command', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.PreToolUse[0]?.hooks[0]?.command).toBe('dungeonmaster-pre-edit-lint');
    });

    it('VALID: includes dungeonmaster-pre-bash command => returns correct command', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.PreToolUse[1]?.hooks[0]?.command).toBe('dungeonmaster-pre-bash');
    });

    it('VALID: includes dungeonmaster-session-start-hook command => returns correct command', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.SessionStart[0]?.hooks[0]?.command).toBe('dungeonmaster-session-start-hook');
    });
  });
});
