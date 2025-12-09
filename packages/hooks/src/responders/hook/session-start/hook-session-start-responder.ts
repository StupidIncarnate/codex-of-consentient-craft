/**
 * PURPOSE: Handles session start hook events by loading architecture overview for new sessions
 *
 * USAGE:
 * const result = await HookSessionStartResponder({ input: sessionStartData });
 * // Returns { shouldOutput: boolean, content?: string } with architecture overview to inject
 */
import { architectureOverviewBroker } from '@dungeonmaster/shared/brokers';
import { sessionIsNewBroker } from '../../../brokers/session/is-new/session-is-new-broker';
import { hookSessionStartResponderResultContract } from '../../../contracts/hook-session-start-responder-result/hook-session-start-responder-result-contract';
import type { SessionStartHookData } from '../../../contracts/session-start-hook-data/session-start-hook-data-contract';
import type { HookSessionStartResponderResult } from '../../../contracts/hook-session-start-responder-result/hook-session-start-responder-result-contract';

/**
 * Responder for session-start hook events.
 *
 * Determines if a session is new and optionally loads architecture overview
 * to inject into the Claude context.
 *
 * @param params - The parameters object
 * @param params.input - The session start hook data
 * @returns Promise with result containing content to output (if any)
 */
export const HookSessionStartResponder = async ({
  input,
}: {
  input: SessionStartHookData;
}): Promise<HookSessionStartResponderResult> => {
  const isNew = await sessionIsNewBroker({ transcriptPath: input.transcript_path });

  // Only load architecture for new sessions (or always, based on preference)
  const shouldLoadArchitecture =
    isNew || process.env.DUNGEONMASTER_ALWAYS_LOAD_STANDARDS === 'true';

  if (shouldLoadArchitecture) {
    const architectureContent = architectureOverviewBroker();

    const sessionType = isNew ? 'NEW SESSION' : 'RESUMED SESSION';
    const content = `<dungeonmaster-architecture>
[${sessionType}] Architecture overview for this codebase:

${architectureContent}

Use MCP tools (get-folder-detail, get-syntax-rules, get-testing-patterns) for detailed patterns.
</dungeonmaster-architecture>\n`;

    return hookSessionStartResponderResultContract.parse({
      shouldOutput: true,
      content,
    });
  }

  return hookSessionStartResponderResultContract.parse({
    shouldOutput: false,
  });
};
