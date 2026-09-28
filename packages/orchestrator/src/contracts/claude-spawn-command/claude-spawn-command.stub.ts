import type { StubArgument } from '@dungeonmaster/shared/@types';

import { claudeSpawnCommandContract } from './claude-spawn-command-contract';
import type { ClaudeSpawnCommand } from './claude-spawn-command-contract';

export const ClaudeSpawnCommandStub = ({
  ...props
}: StubArgument<ClaudeSpawnCommand> = {}): ClaudeSpawnCommand =>
  claudeSpawnCommandContract.parse({
    args: ['-p', 'You are an AI assistant.'],
    env: { CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0' },
    ...props,
  });
