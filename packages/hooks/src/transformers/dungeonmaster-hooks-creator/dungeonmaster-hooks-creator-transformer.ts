/**
 * PURPOSE: Create dungeonmaster hooks configuration object for Claude settings.json
 *
 * USAGE:
 * const hooks = dungeonmasterHooksCreatorTransformer();
 * // Returns: { PreToolUse: [...], PostToolUse: [...], SessionStart: [...], SubagentStart: [...], SubagentStop: [...], WorktreeCreate: [...] }
 */

import { claudeSettingsContract } from '../../contracts/claude-settings/claude-settings-contract';
import type {
  PreToolUseHook,
  PostToolUseHook,
  SessionStartHook,
  WorktreeCreateHook,
} from '../../contracts/claude-settings/claude-settings-contract';
import { mcpCallerContextStatics, sessionSnippetStatics } from '@dungeonmaster/shared/statics';
import { gatewaySyncHookStatics } from '../../statics/gateway-sync-hook/gateway-sync-hook-statics';

export const dungeonmasterHooksCreatorTransformer = (): {
  PreToolUse: PreToolUseHook[];
  PostToolUse: PostToolUseHook[];
  SessionStart: SessionStartHook[];
  SubagentStart: SessionStartHook[];
  SubagentStop: SessionStartHook[];
  WorktreeCreate: WorktreeCreateHook[];
} => {
  // Parse through contract to get branded types
  const parsed = claudeSettingsContract.parse({
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
          matcher: mcpCallerContextStatics.hook.matcher,
          hooks: [{ type: 'command', command: 'dungeonmaster-pre-mcp-caller' }],
        },
      ],
      PostToolUse: [
        {
          matcher: 'AskUserQuestion',
          hooks: [{ type: 'command', command: 'dungeonmaster-post-ask-question' }],
        },
        {
          matcher: gatewaySyncHookStatics.hook.matcher,
          hooks: [
            {
              type: 'command',
              command: gatewaySyncHookStatics.hook.bin,
              timeout: gatewaySyncHookStatics.hook.settingsTimeoutSeconds,
            },
          ],
        },
      ],
      SessionStart: [
        ...Object.keys(sessionSnippetStatics).map((key) => ({
          hooks: [{ type: 'command', command: `dungeonmaster-session-snippet ${key}` }],
        })),
      ],
      SubagentStart: [
        ...Object.keys(sessionSnippetStatics).map((key) => ({
          hooks: [{ type: 'command', command: `dungeonmaster-session-snippet ${key}` }],
        })),
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

  return {
    PreToolUse: parsed.hooks?.PreToolUse ?? [],
    PostToolUse: parsed.hooks?.PostToolUse ?? [],
    SessionStart: parsed.hooks?.SessionStart ?? [],
    SubagentStart: parsed.hooks?.SubagentStart ?? [],
    SubagentStop: parsed.hooks?.SubagentStop ?? [],
    WorktreeCreate: parsed.hooks?.WorktreeCreate ?? [],
  };
};
