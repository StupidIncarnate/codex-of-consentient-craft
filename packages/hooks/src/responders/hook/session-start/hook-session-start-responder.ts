/**
 * PURPOSE: Handles session start hook events by loading standards for new sessions
 *
 * USAGE:
 * const result = await HookSessionStartResponder({ input: sessionStartData });
 * // Returns { shouldOutput: boolean, content?: string } with standards to inject
 */
import { sessionIsNewBroker } from '../../../brokers/session/is-new/session-is-new-broker';
import { standardsLoadFilesBroker } from '../../../brokers/standards/load-files/standards-load-files-broker';
import { hookSessionStartResponderResultContract } from '../../../contracts/hook-session-start-responder-result/hook-session-start-responder-result-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { SessionStartHookData } from '../../../contracts/session-start-hook-data/session-start-hook-data-contract';
import type { HookSessionStartResponderResult } from '../../../contracts/hook-session-start-responder-result/hook-session-start-responder-result-contract';

/**
 * Responder for session-start hook events.
 *
 * Determines if a session is new and optionally loads coding standards
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

  // Only load standards for new sessions (or always, based on preference)
  const shouldLoadStandards = isNew || process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS === 'true';

  if (shouldLoadStandards) {
    const standardsContent = await standardsLoadFilesBroker({
      cwd: filePathContract.parse(input.cwd),
    });

    if (standardsContent.trim()) {
      const sessionType = isNew ? 'NEW SESSION' : 'RESUMED SESSION';
      const content = `<questmaestro-standards>
[${sessionType}] The following coding and testing standards should be followed throughout this session:

${standardsContent}

Please refer to these standards when writing, reviewing, or suggesting code changes.
</questmaestro-standards>\n`;

      return hookSessionStartResponderResultContract.parse({
        shouldOutput: true,
        content,
      });
    }
  }

  return hookSessionStartResponderResultContract.parse({
    shouldOutput: false,
  });
};
