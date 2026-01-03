import type { ClaudeSettings } from './claude-settings-contract';
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
          hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
        },
      ],
    },
    ...props,
  });
