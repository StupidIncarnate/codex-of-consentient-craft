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
          {
            matcher: 'Grep|Glob|Search|Find',
            hooks: [{ type: 'command', command: 'dungeonmaster-pre-search' }],
          },
        ],
        SessionStart: [
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }],
          },
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet searchStrategy' }],
          },
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet folderTypes' }],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet modifyingCodeGuidance',
              },
            ],
          },
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet ward' }],
          },
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }],
          },
        ],
        SubagentStart: [
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }],
          },
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet searchStrategy' }],
          },
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet folderTypes' }],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet modifyingCodeGuidance',
              },
            ],
          },
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet ward' }],
          },
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }],
          },
        ],
        WorktreeCreate: [
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-worktree-create' }],
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

    it('VALID: includes PreToolUse with Grep|Glob|Search|Find matcher => returns correct matcher', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.PreToolUse[2]?.matcher).toBe('Grep|Glob|Search|Find');
    });

    it('VALID: includes dungeonmaster-pre-search command => returns correct command', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.PreToolUse[2]?.hooks[0]?.command).toBe('dungeonmaster-pre-search');
    });

    it('VALID: includes dungeonmaster-session-snippet commands => returns correct commands', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.SessionStart[0]?.hooks[0]?.command).toBe(
        'dungeonmaster-session-snippet discover',
      );
      expect(result.SessionStart[4]?.hooks[0]?.command).toBe('dungeonmaster-session-snippet ward');
      expect(result.SessionStart[5]?.hooks[0]?.command).toBe(
        'dungeonmaster-session-snippet packages',
      );
    });

    it('VALID: SubagentStart matches SessionStart snippet entries => same snippet hooks', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.SubagentStart).toStrictEqual(result.SessionStart);
    });

    it('VALID: includes dungeonmaster-worktree-create command => returns correct command', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.WorktreeCreate[0]?.hooks[0]?.command).toBe('dungeonmaster-worktree-create');
    });
  });
});
