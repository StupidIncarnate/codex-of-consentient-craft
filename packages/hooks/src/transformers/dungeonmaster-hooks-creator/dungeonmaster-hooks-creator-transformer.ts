/**
 * PURPOSE: Create dungeonmaster hooks configuration object for Claude settings.json
 *
 * USAGE:
 * const hooks = dungeonmasterHooksCreatorTransformer();
 * // Returns: { PreToolUse: [...], SessionStart: [...], WorktreeCreate: [...] }
 *
 * CONTRACTS: Output: { PreToolUseHook[], SessionStart: SessionStartHook[], WorktreeCreate: WorktreeCreateHook[] }
 */

import { claudeSettingsContract } from '../../contracts/claude-settings/claude-settings-contract';
import type {
  PreToolUseHook,
  // PostToolUseHook,
  SessionStartHook,
  WorktreeCreateHook,
} from '../../contracts/claude-settings/claude-settings-contract';
import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';

export const dungeonmasterHooksCreatorTransformer = (): {
  PreToolUse: PreToolUseHook[];
  // PostToolUse: PostToolUseHook[];
  SessionStart: SessionStartHook[];
  SubagentStart: SessionStartHook[];
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
      ],
      // PostToolUse: [
      //   {
      //     matcher: 'Write|Edit|MultiEdit',
      //     hooks: [{ type: 'command', command: 'dungeonmaster-post-edit-lint' }],
      //   },
      // ],
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
      WorktreeCreate: [
        {
          hooks: [{ type: 'command', command: 'dungeonmaster-worktree-create' }],
        },
      ],
    },
  });

  return {
    PreToolUse: parsed.hooks?.PreToolUse ?? [],
    // PostToolUse: parsed.hooks?.PostToolUse ?? [],
    SessionStart: parsed.hooks?.SessionStart ?? [],
    SubagentStart: parsed.hooks?.SubagentStart ?? [],
    WorktreeCreate: parsed.hooks?.WorktreeCreate ?? [],
  };
};
