/**
 * PURPOSE: Handles SubagentStart hook events by injecting architecture overview and discover guidance into subagent context
 *
 * USAGE:
 * const result = HookSubagentStartResponder({ input: subagentStartData });
 * // Returns { shouldOutput: true, content: string } with architecture + discover guidance to inject
 */
import { architectureOverviewBroker } from '@dungeonmaster/shared/brokers';
import { hookSessionStartResponderResultContract } from '../../../contracts/hook-session-start-responder-result/hook-session-start-responder-result-contract';
import type { HookSessionStartResponderResult } from '../../../contracts/hook-session-start-responder-result/hook-session-start-responder-result-contract';

export const HookSubagentStartResponder = (): HookSessionStartResponderResult => {
  const architectureContent = architectureOverviewBroker();

  const content = `<dungeonmaster-architecture>
[SUBAGENT SPAWNED] Architecture overview for this codebase:

${architectureContent}
</dungeonmaster-architecture>\n`;

  return hookSessionStartResponderResultContract.parse({
    shouldOutput: true,
    content,
  });
};
