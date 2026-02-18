/**
 * PURPOSE: Create dungeonmaster hooks configuration object for Claude settings.json
 *
 * USAGE:
 * const hooks = dungeonmasterHooksCreatorTransformer();
 * // Returns: { PreToolUse: [...], SessionStart: [...] }
 *
 * CONTRACTS: Output: { PreToolUseHook[], SessionStart: SessionStartHook[] }
 */

import { claudeSettingsContract } from '../../contracts/claude-settings/claude-settings-contract';
import type {
  PreToolUseHook,
  // PostToolUseHook,
  SessionStartHook,
} from '../../contracts/claude-settings/claude-settings-contract';

export const dungeonmasterHooksCreatorTransformer = (): {
  PreToolUse: PreToolUseHook[];
  // PostToolUse: PostToolUseHook[];
  SessionStart: SessionStartHook[];
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
      ],
      // PostToolUse: [
      //   {
      //     matcher: 'Write|Edit|MultiEdit',
      //     hooks: [{ type: 'command', command: 'dungeonmaster-post-edit-lint' }],
      //   },
      // ],
      SessionStart: [
        {
          hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
        },
      ],
    },
  });

  return {
    PreToolUse: parsed.hooks?.PreToolUse ?? [],
    // PostToolUse: parsed.hooks?.PostToolUse ?? [],
    SessionStart: parsed.hooks?.SessionStart ?? [],
  };
};
