import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { AgentsHooksConfig } from './agents-hooks-config-contract';
import { agentsHooksConfigContract } from './agents-hooks-config-contract';

export const AgentsHooksConfigStub = ({
  ...props
}: StubArgument<AgentsHooksConfig> = {}): AgentsHooksConfig =>
  agentsHooksConfigContract.parse({
    'dungeonmaster-guard': {
      PreToolUse: [
        {
          matcher: 'run_command',
          hooks: [{ type: 'command', command: 'dungeonmaster-agy-pre-tool' }],
        },
      ],
      Stop: [{ type: 'command', command: 'dungeonmaster-agy-stop' }],
    },
    ...props,
  });
