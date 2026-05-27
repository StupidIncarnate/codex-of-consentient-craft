import type { ClaudeSettings, PostToolUseHook, PreToolUseHook } from './claude-settings-contract';
import { claudeSettingsContract } from './claude-settings-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const ClaudeSettingsStub = ({
  ...props
}: StubArgument<ClaudeSettings> = {}): ClaudeSettings =>
  claudeSettingsContract.parse({
    hooks: {
      PreToolUse: [
        {
          matcher: 'Write|Edit|MultiEdit',
          hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }],
        },
      ],
      SessionStart: [
        {
          hooks: [{ type: 'command', command: 'dungeonmaster-session-snippet discover' }],
        },
      ],
    },
    ...props,
  });

export const PreToolUseHookStub = ({
  ...props
}: StubArgument<PreToolUseHook> = {}): PreToolUseHook => {
  const parsed = claudeSettingsContract.parse({
    hooks: {
      PreToolUse: [
        {
          matcher: 'Write|Edit|MultiEdit',
          hooks: [{ type: 'command', command: 'their-hook' }],
          ...props,
        },
      ],
    },
  });
  const entry = parsed.hooks?.PreToolUse?.[0];
  if (entry === undefined) throw new Error('PreToolUseHookStub failed to construct entry');
  return entry;
};

export const PostToolUseHookStub = ({
  ...props
}: StubArgument<PostToolUseHook> = {}): PostToolUseHook => {
  const parsed = claudeSettingsContract.parse({
    hooks: {
      PostToolUse: [
        {
          matcher: 'AskUserQuestion',
          hooks: [{ type: 'command', command: 'their-post-hook' }],
          ...props,
        },
      ],
    },
  });
  const entry = parsed.hooks?.PostToolUse?.[0];
  if (entry === undefined) throw new Error('PostToolUseHookStub failed to construct entry');
  return entry;
};
