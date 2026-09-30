import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { InstallCreateSettingsResponderProxy } from './install-create-settings-responder.proxy';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('InstallCreateSettingsResponder', () => {
  describe('no existing settings', () => {
    it('VALID: {no existing settings file} => creates settings.json with hooks', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupNoExistingSettings();

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'created',
        message: 'Created .claude/settings.json with hooks',
      });

      const writtenContent = String(proxy.getWrittenContent());

      // String-exact: the write ends in exactly one trailing newline.
      expect(writtenContent.endsWith('\n')).toBe(true);
      expect(writtenContent.endsWith('\n\n')).toBe(false);

      const written = JSON.parse(writtenContent) as Record<PropertyKey, unknown>;

      expect(written).toStrictEqual({
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
            {
              matcher: 'mcp__dungeonmaster__.*',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-mcp-caller' }],
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
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet consumerGatewayWrapper',
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
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet consumerGatewayWrapper',
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
        },
      });
    });
  });

  describe('existing settings with values newer than the contract', () => {
    it('VALID: {unknown promptCacheTtl and crossSessionInbound} => merged write keeps both values', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupExistingSettings({
        content: JSON.stringify({
          promptCacheTtl: '24h',
          subagentPromptCacheTtl: '6h',
          crossSessionInbound: 'quarantine',
        }),
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
      });

      const written = JSON.parse(String(proxy.getWrittenContent())) as Record<PropertyKey, unknown>;

      expect({
        result,
        promptCacheTtl: written.promptCacheTtl,
        subagentPromptCacheTtl: written.subagentPromptCacheTtl,
        crossSessionInbound: written.crossSessionInbound,
      }).toStrictEqual({
        result: {
          packageName: '@dungeonmaster/hooks',
          success: true,
          action: 'merged',
          message: 'Merged hooks into existing settings',
        },
        promptCacheTtl: '24h',
        subagentPromptCacheTtl: '6h',
        crossSessionInbound: 'quarantine',
      });
    });
  });

  describe('existing settings without dungeonmaster', () => {
    it('VALID: {existing settings without dungeonmaster} => merges hooks into existing settings', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupExistingSettings({
        content: JSON.stringify({ tools: { Write: { enabled: true } } }, null, 2),
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });

      const writtenContent = String(proxy.getWrittenContent());

      // String-exact: a merged write also ends in exactly one trailing newline.
      expect(writtenContent.endsWith('\n')).toBe(true);
      expect(writtenContent.endsWith('\n\n')).toBe(false);

      const written = JSON.parse(writtenContent) as Record<PropertyKey, unknown>;

      expect(written).toStrictEqual({
        tools: { Write: { enabled: true } },
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
            {
              matcher: 'mcp__dungeonmaster__.*',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-mcp-caller' }],
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
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet consumerGatewayWrapper',
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
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet consumerGatewayWrapper',
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
        },
      });
    });
  });

  describe('dungeonmaster hooks already present', () => {
    it('VALID: {settings already has prior dungeonmaster hooks} => prior entries stripped, freshly-generated set re-appended including new hook types', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupExistingSettings({
        content: JSON.stringify(
          {
            hooks: {
              PreToolUse: [
                { hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }] },
              ],
            },
          },
          null,
          2,
        ),
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });

      const written = JSON.parse(String(proxy.getWrittenContent())) as Record<PropertyKey, unknown>;

      // The prior solo dungeonmaster-pre-edit-lint entry is stripped and the full freshly-generated
      // set is re-appended — INCLUDING the new PostToolUse hook that the prior settings didn't have.
      // Proves additive re-install for new hook types.
      expect(written).toStrictEqual({
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
            {
              matcher: 'mcp__dungeonmaster__.*',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-mcp-caller' }],
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet consumerGatewayWrapper',
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet consumerGatewayWrapper',
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
  });

  describe('existing settings with other hooks', () => {
    it('VALID: {existing settings with other hooks} => preserves existing hooks when merging', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupExistingSettings({
        content: JSON.stringify(
          {
            hooks: {
              PreToolUse: [{ hooks: [{ type: 'command', command: 'existing-hook' }] }],
              SessionStart: [{ hooks: [{ type: 'command', command: 'existing-session-hook' }] }],
            },
          },
          null,
          2,
        ),
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });

      const written = JSON.parse(String(proxy.getWrittenContent())) as Record<PropertyKey, unknown>;

      expect(written).toStrictEqual({
        crossSessionInbound: 'refuse',
        promptCacheTtl: '1h',
        subagentPromptCacheTtl: '1h',
        promptSuggestionEnabled: false,
        env: { CLAUDE_CODE_SUBAGENT_MODEL: 'sonnet' },
        hooks: {
          PreToolUse: [
            { hooks: [{ type: 'command', command: 'existing-hook' }] },
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
            {
              matcher: 'mcp__dungeonmaster__.*',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-mcp-caller' }],
            },
          ],
          PostToolUse: [
            {
              matcher: 'AskUserQuestion',
              hooks: [{ type: 'command', command: 'dungeonmaster-post-ask-question' }],
            },
          ],
          SessionStart: [
            { hooks: [{ type: 'command', command: 'existing-session-hook' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }],
            },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet searchStrategy' }],
            },
            {
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet consumerGatewayWrapper',
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
              hooks: [
                { type: 'command', command: 'dungeonmaster-session-snippet reportingFindings' },
              ],
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet consumerGatewayWrapper',
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
        },
      });
    });
  });

  describe('existing settings with their own session defaults', () => {
    it('VALID: {existing promptCacheTtl, crossSessionInbound, promptSuggestionEnabled and env var} => keeps every value already set and fills only the absent ones', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupExistingSettings({
        content: JSON.stringify(
          {
            crossSessionInbound: 'accept',
            promptCacheTtl: '5m',
            promptSuggestionEnabled: true,
            env: { EXISTING_VAR: 'kept' },
          },
          null,
          2,
        ),
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });

      const written = JSON.parse(String(proxy.getWrittenContent())) as Record<PropertyKey, unknown>;

      // crossSessionInbound, promptCacheTtl and promptSuggestionEnabled keep the consumer's values,
      // subagentPromptCacheTtl was absent so the default lands, and env gains the subagent model
      // WITHOUT losing EXISTING_VAR — the three outcomes the spread order in the responder has to
      // produce.
      expect(written).toStrictEqual({
        crossSessionInbound: 'accept',
        promptCacheTtl: '5m',
        subagentPromptCacheTtl: '1h',
        promptSuggestionEnabled: true,
        env: { CLAUDE_CODE_SUBAGENT_MODEL: 'sonnet', EXISTING_VAR: 'kept' },
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
            {
              matcher: 'mcp__dungeonmaster__.*',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-mcp-caller' }],
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet consumerGatewayWrapper',
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
            {
              hooks: [
                {
                  type: 'command',
                  command: 'dungeonmaster-session-snippet consumerGatewayWrapper',
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
  });

  describe('corrupt or unreadable settings.json', () => {
    it('ERROR: {settings.json: invalid JSON} => rejects naming the file, and never writes', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupCorruptSettings();

      await expect(
        proxy.callResponder({
          context: InstallContextStub({
            value: {
              targetProjectRoot: '/project',
              dungeonmasterRoot: '/dm-root',
            },
          }),
        }),
      ).rejects.toStrictEqual(new SyntaxError('Invalid JSON in /project/.claude/settings.json'));

      expect(proxy.getWrittenContent()).toBe(undefined);
    });

    it('ERROR: {settings.json: permission denied} => rejects with the raw EACCES error, and never writes', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupUnreadableSettings();

      await expect(
        proxy.callResponder({
          context: InstallContextStub({
            value: {
              targetProjectRoot: '/project',
              dungeonmasterRoot: '/dm-root',
            },
          }),
        }),
      ).rejects.toStrictEqual(
        FsErrorStub({
          code: 'EACCES',
          path: '/project/.claude/settings.json',
          syscall: 'open',
        }),
      );

      expect(proxy.getWrittenContent()).toBe(undefined);
    });
  });

  describe('keys the consumer owns', () => {
    it('VALID: {unknown top-level key, unknown event, unknown key in a hook entry} => all survive the upsert', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupExistingSettings({
        content: JSON.stringify({
          model: 'opus',
          permissions: { allow: ['Bash(ls)'], defaultMode: 'plan' },
          hooks: {
            Stop: [{ hooks: [{ type: 'command', command: 'their-stop', timeout: 30 }] }],
            PreToolUse: [
              {
                matcher: 'Foo',
                hooks: [{ type: 'command', command: 'my-other-tool', timeout: 5 }],
              },
              { hooks: [{ type: 'http', url: 'https://example.test/hook' }] },
            ],
          },
        }),
      });

      await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
      });

      const written = JSON.parse(String(proxy.getWrittenContent())) as Record<PropertyKey, unknown>;
      const writtenHooks = written.hooks as Record<PropertyKey, unknown[]>;

      expect({
        model: written.model,
        permissions: written.permissions,
        stop: writtenHooks.Stop,
        preToolUseHeadEntries: writtenHooks.PreToolUse?.slice(0, 2),
      }).toStrictEqual({
        model: 'opus',
        permissions: { allow: ['Bash(ls)'], defaultMode: 'plan' },
        stop: [{ hooks: [{ type: 'command', command: 'their-stop', timeout: 30 }] }],
        preToolUseHeadEntries: [
          { matcher: 'Foo', hooks: [{ type: 'command', command: 'my-other-tool', timeout: 5 }] },
          { hooks: [{ type: 'http', url: 'https://example.test/hook' }] },
        ],
      });
    });

    it('ERROR: {settings.json: hooks is a string} => rejects naming the bad path, and never writes', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupExistingSettings({
        content: JSON.stringify({ hooks: 'not-an-object' }),
      });

      await expect(
        proxy.callResponder({
          context: InstallContextStub({
            value: {
              targetProjectRoot: '/project',
              dungeonmasterRoot: '/dm-root',
            },
          }),
        }),
      ).rejects.toThrow(/"hooks"/u);

      expect(proxy.getWrittenContent()).toBe(undefined);
    });

    it('ERROR: {settings.json: PreToolUse is not an array} => rejects and never writes', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupExistingSettings({
        content: JSON.stringify({ hooks: { PreToolUse: {} } }),
      });

      await expect(
        proxy.callResponder({
          context: InstallContextStub({
            value: {
              targetProjectRoot: '/project',
              dungeonmasterRoot: '/dm-root',
            },
          }),
        }),
      ).rejects.toThrow(/PreToolUse/u);

      expect(proxy.getWrittenContent()).toBe(undefined);
    });
  });
});
