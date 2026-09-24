import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing settings} => creates settings.json with hooks', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'create-hooks' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'created',
        message: 'Created .claude/settings.json with hooks',
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      const parsed = JSON.parse(settingsContent!) as Record<PropertyKey, unknown>;

      expect(parsed).toStrictEqual({
        crossSessionInbound: 'refuse',
        promptCacheTtl: '1h',
        subagentPromptCacheTtl: '1h',
        promptSuggestionEnabled: false,
        env: { CLAUDE_CODE_SUBAGENT_MODEL: 'sonnet' },
        hooks: {
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
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet searchStrategy' }],
            },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet folderTypes' }] },
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet modifyingCodeGuidance',
                },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet ward' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet wardDiscipline' }],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }] },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet backgroundTasks' },
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet siegelense',
                },
              ],
            },
          ],
          SubagentStart: [
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet searchStrategy' }],
            },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet folderTypes' }] },
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet modifyingCodeGuidance',
                },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet ward' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet wardDiscipline' }],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }] },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet backgroundTasks' },
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet siegelense',
                },
              ],
            },
          ],
          SubagentStop: [{ hooks: [{ type: 'command', command: 'dungeonmaster-subagent-stop' }] }],
          WorktreeCreate: [
            { hooks: [{ type: 'command', command: 'dungeonmaster-worktree-create' }] },
          ],
        },
      });
    });

    it('VALID: {context: existing settings without dungeonmaster} => merges hooks into existing settings', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'merge-hooks' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
        content: FileContentStub({
          value: JSON.stringify({ tools: { Write: { enabled: true } } }, null, 2),
        }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      const parsed = JSON.parse(settingsContent!) as Record<PropertyKey, unknown>;

      expect(parsed).toStrictEqual({
        crossSessionInbound: 'refuse',
        promptCacheTtl: '1h',
        subagentPromptCacheTtl: '1h',
        promptSuggestionEnabled: false,
        env: { CLAUDE_CODE_SUBAGENT_MODEL: 'sonnet' },
        tools: { Write: { enabled: true } },
        hooks: {
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
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet searchStrategy' }],
            },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet folderTypes' }] },
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet modifyingCodeGuidance',
                },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet ward' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet wardDiscipline' }],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }] },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet backgroundTasks' },
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet siegelense',
                },
              ],
            },
          ],
          SubagentStart: [
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet searchStrategy' }],
            },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet folderTypes' }] },
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet modifyingCodeGuidance',
                },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet ward' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet wardDiscipline' }],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }] },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet backgroundTasks' },
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet siegelense',
                },
              ],
            },
          ],
          SubagentStop: [{ hooks: [{ type: 'command', command: 'dungeonmaster-subagent-stop' }] }],
          WorktreeCreate: [
            { hooks: [{ type: 'command', command: 'dungeonmaster-worktree-create' }] },
          ],
        },
      });
    });

    it('VALID: {context: settings already has prior dungeonmaster hooks} => prior entries stripped, freshly-generated set re-appended including new hook types', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'reinstall-hooks' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            {
              hooks: {
                PreToolUse: [{ hooks: [{ command: 'dungeonmaster-pre-edit-lint' }] }],
              },
            },
            null,
            2,
          ),
        }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });

      const parsed = JSON.parse(settingsContent!) as Record<PropertyKey, unknown>;

      // Prior solo dungeonmaster-pre-edit-lint entry stripped; freshly-generated set re-appended
      // INCLUDING the new PostToolUse hook that wasn't in the prior settings — proves additive re-install.
      expect(parsed).toStrictEqual({
        crossSessionInbound: 'refuse',
        promptCacheTtl: '1h',
        subagentPromptCacheTtl: '1h',
        promptSuggestionEnabled: false,
        env: { CLAUDE_CODE_SUBAGENT_MODEL: 'sonnet' },
        hooks: {
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
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet searchStrategy' }],
            },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet folderTypes' }] },
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet modifyingCodeGuidance',
                },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet ward' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet wardDiscipline' }],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }] },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet backgroundTasks' },
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet siegelense',
                },
              ],
            },
          ],
          SubagentStart: [
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet searchStrategy' }],
            },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet folderTypes' }] },
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet modifyingCodeGuidance',
                },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet ward' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet wardDiscipline' }],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }] },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet backgroundTasks' },
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet siegelense',
                },
              ],
            },
          ],
          SubagentStop: [{ hooks: [{ type: 'command', command: 'dungeonmaster-subagent-stop' }] }],
          WorktreeCreate: [
            { hooks: [{ type: 'command', command: 'dungeonmaster-worktree-create' }] },
          ],
        },
      });
    });

    it('VALID: {context: existing settings with other hooks} => preserves existing hooks when merging', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'preserve-hooks' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            {
              hooks: {
                PreToolUse: [{ hooks: [{ command: 'existing-hook' }] }],
                SessionStart: [{ hooks: [{ command: 'existing-session-hook' }] }],
              },
            },
            null,
            2,
          ),
        }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      const parsed = JSON.parse(settingsContent!) as Record<PropertyKey, unknown>;

      expect(parsed).toStrictEqual({
        crossSessionInbound: 'refuse',
        promptCacheTtl: '1h',
        subagentPromptCacheTtl: '1h',
        promptSuggestionEnabled: false,
        env: { CLAUDE_CODE_SUBAGENT_MODEL: 'sonnet' },
        hooks: {
          PreToolUse: [
            { hooks: [{ command: 'existing-hook' }] },
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
            { hooks: [{ command: 'existing-session-hook' }] },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet searchStrategy' }],
            },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet folderTypes' }] },
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet modifyingCodeGuidance',
                },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet ward' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet wardDiscipline' }],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }] },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet backgroundTasks' },
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet siegelense',
                },
              ],
            },
          ],
          SubagentStart: [
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet searchStrategy' }],
            },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet folderTypes' }] },
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet modifyingCodeGuidance',
                },
              ],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet ward' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet wardDiscipline' }],
            },
            { hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet packages' }] },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet backgroundTasks' },
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet siegelense',
                },
              ],
            },
          ],
          SubagentStop: [{ hooks: [{ type: 'command', command: 'dungeonmaster-subagent-stop' }] }],
          WorktreeCreate: [
            { hooks: [{ type: 'command', command: 'dungeonmaster-worktree-create' }] },
          ],
        },
      });
    });

    describe('Antigravity setup', () => {
      it('VALID: creates .agents/hooks.json, skills.json, plugins/dungeonmaster/rules/AGENTS.md and writes AGENTS.md', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'agents-setup' }),
        });

        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'CLAUDE.md' }),
          content: FileContentStub({ value: '# Claude guidelines\n' }),
        });

        const result = await StartInstall({
          context: {
            targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        });

        expect(result.success).toBe(true);

        const hooksContent = testbed.readFile({
          relativePath: RelativePathStub({ value: '.agents/hooks.json' }),
        });
        const skillsContent = testbed.readFile({
          relativePath: RelativePathStub({ value: '.agents/skills.json' }),
        });
        const rulesContent = testbed.readFile({
          relativePath: RelativePathStub({
            value: '.agents/plugins/dungeonmaster/rules/AGENTS.md',
          }),
        });
        const agentsMdContent = testbed.readFile({
          relativePath: RelativePathStub({ value: 'AGENTS.md' }),
        });

        testbed.cleanup();

        const parsedHooks = JSON.parse(hooksContent!) as Record<PropertyKey, unknown>;

        expect(parsedHooks).toStrictEqual({
          'dungeonmaster-guard': {
            PreToolUse: [
              {
                matcher: 'run_command|replace_file_content|write_to_file|grep_search|find_by_name',
                hooks: [{ type: 'command', command: 'dungeonmaster-agy-pre-tool' }],
              },
            ],
            Stop: [{ type: 'command', command: 'dungeonmaster-agy-stop' }],
          },
        });

        const parsedSkills = JSON.parse(skillsContent!) as Record<PropertyKey, unknown>;

        expect(parsedSkills).toStrictEqual({
          entries: [{ path: '.claude/skills' }],
        });

        expect(rulesContent!.startsWith('# Dungeonmaster Operating Rules\n\n')).toBe(true);
        expect(agentsMdContent).toBe(
          '# Agent Guidelines\n\nGo read [CLAUDE.md](file://./CLAUDE.md) to get context on the project and repo before doing any other exploratory work.\n\n## Antigravity MCP Calling\n\nAll Dungeonmaster MCP tools (`get-project-map`, `discover`, `get-architecture`, `signal-back`, etc.) are available via `call_mcp_tool` under server `dungeonmaster_dungeonmaster`.\n',
        );
      });
    });
  });
});
