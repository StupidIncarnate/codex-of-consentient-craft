/**
 * PURPOSE: Creates the default .agents/hooks.json configuration wiring Antigravity PreToolUse and Stop lifecycle events to dungeonmaster adapter binaries
 *
 * USAGE:
 * const hooksConfig = agentsHooksCreatorTransformer();
 * // Returns: { 'dungeonmaster-guard': { PreToolUse: [...], Stop: [...] } }
 */

import {
  agentsHooksConfigContract,
  type AgentsHooksConfig,
} from '../../contracts/agents-hooks-config/agents-hooks-config-contract';

export const agentsHooksCreatorTransformer = (): AgentsHooksConfig =>
  agentsHooksConfigContract.parse({
    'dungeonmaster-guard': {
      PreToolUse: [
        {
          matcher: 'run_command|replace_file_content|write_to_file|grep_search|find_by_name',
          hooks: [
            {
              type: 'command',
              command: 'dungeonmaster-agy-pre-tool',
            },
          ],
        },
      ],
      Stop: [
        {
          type: 'command',
          command: 'dungeonmaster-agy-stop',
        },
      ],
    },
  });
