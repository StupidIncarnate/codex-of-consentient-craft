import { debugDebug } from '../../../adapters/debug/debug-debug';
import { isNewSession } from '../../../contracts/is-new-session/is-new-session';
import { standardsLoadFilesBroker } from '../../../brokers/standards/load-files/standards-load-files-broker';
import type { SessionStartHookData } from '../../../contracts/session-start-hook-data/session-start-hook-data';

const log = debugDebug({ namespace: 'questmaestro:session-start-hook' });

const JSON_INDENT_SPACES = 2;

export interface HookSessionStartResponderResult {
  shouldOutput: boolean;
  content?: string;
}

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
  log('Session start hook data:', JSON.stringify(input, undefined, JSON_INDENT_SPACES));

  const isNew = await isNewSession({ transcriptPath: input.transcript_path });
  log('Is new session:', isNew);

  // Only load standards for new sessions (or always, based on preference)
  const shouldLoadStandards = isNew || process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS === 'true';

  if (shouldLoadStandards) {
    const standardsContent = await standardsLoadFilesBroker({ cwd: input.cwd });

    if (standardsContent.trim()) {
      const sessionType = isNew ? 'NEW SESSION' : 'RESUMED SESSION';
      const content = `<questmaestro-standards>
[${sessionType}] The following coding and testing standards should be followed throughout this session:

${standardsContent}

Please refer to these standards when writing, reviewing, or suggesting code changes.
</questmaestro-standards>\n`;

      log(`Standards loaded successfully into ${sessionType.toLowerCase()} context`);

      return {
        shouldOutput: true,
        content,
      };
    }
    log('No standards content found');
  }

  log('Skipping standards load for resumed session');

  return {
    shouldOutput: false,
  };
};
