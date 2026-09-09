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
          {
            matcher: 'Write',
            hooks: [{ type: 'command', command: 'dungeonmaster-pre-folder-detail' }],
          },
        ],
        PostToolUse: [
          {
            matcher: 'AskUserQuestion',
            hooks: [{ type: 'command', command: 'dungeonmaster-post-ask-question' }],
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
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet wardDiscipline' }],
          },
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet backgroundTasks',
              },
            ],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet commentDiscipline',
              },
            ],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet buildDiscipline',
              },
            ],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet worktrees',
              },
            ],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet generatedConfig',
              },
            ],
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
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet wardDiscipline' }],
          },
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet backgroundTasks',
              },
            ],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet commentDiscipline',
              },
            ],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet buildDiscipline',
              },
            ],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet worktrees',
              },
            ],
          },
          {
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-session-snippet generatedConfig',
              },
            ],
          },
        ],
        SubagentStop: [
          {
            hooks: [{ type: 'command', command: 'dungeonmaster-subagent-stop' }],
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

    it('VALID: includes PreToolUse with Write matcher for folder detail => returns correct matcher', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.PreToolUse[3]?.matcher).toBe('Write');
    });

    it('VALID: includes dungeonmaster-pre-folder-detail command => returns correct command', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.PreToolUse[3]?.hooks[0]?.command).toBe('dungeonmaster-pre-folder-detail');
    });

    it('VALID: includes dungeonmaster-session-snippet commands => returns correct commands', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect({
        first: result.SessionStart[0]?.hooks[0]?.command,
        ward: result.SessionStart[4]?.hooks[0]?.command,
        wardDiscipline: result.SessionStart[5]?.hooks[0]?.command,
        packages: result.SessionStart[6]?.hooks[0]?.command,
        backgroundTasks: result.SessionStart[7]?.hooks[0]?.command,
        commentDiscipline: result.SessionStart[8]?.hooks[0]?.command,
        buildDiscipline: result.SessionStart[9]?.hooks[0]?.command,
        worktrees: result.SessionStart[10]?.hooks[0]?.command,
        generatedConfig: result.SessionStart[11]?.hooks[0]?.command,
      }).toStrictEqual({
        first: 'dungeonmaster-session-snippet discover',
        ward: 'dungeonmaster-session-snippet ward',
        wardDiscipline: 'dungeonmaster-session-snippet wardDiscipline',
        packages: 'dungeonmaster-session-snippet packages',
        backgroundTasks: 'dungeonmaster-session-snippet backgroundTasks',
        commentDiscipline: 'dungeonmaster-session-snippet commentDiscipline',
        buildDiscipline: 'dungeonmaster-session-snippet buildDiscipline',
        worktrees: 'dungeonmaster-session-snippet worktrees',
        generatedConfig: 'dungeonmaster-session-snippet generatedConfig',
      });
    });

    it('VALID: SubagentStart matches SessionStart snippet entries => same snippet hooks', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.SubagentStart).toStrictEqual(result.SessionStart);
    });

    it('VALID: includes dungeonmaster-worktree-create command => returns correct command', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.WorktreeCreate[0]?.hooks[0]?.command).toBe('dungeonmaster-worktree-create');
    });

    it('VALID: includes a single SubagentStop entry => dungeonmaster-subagent-stop command', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.SubagentStop).toStrictEqual([
        { hooks: [{ type: 'command', command: 'dungeonmaster-subagent-stop' }] },
      ]);
    });

    it('VALID: includes PostToolUse AskUserQuestion matcher => returns correct matcher', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.PostToolUse[0]?.matcher).toBe('AskUserQuestion');
    });

    it('VALID: includes dungeonmaster-post-ask-question command => returns correct command', () => {
      const result = dungeonmasterHooksCreatorTransformer();

      expect(result.PostToolUse[0]?.hooks[0]?.command).toBe('dungeonmaster-post-ask-question');
    });
  });
});
