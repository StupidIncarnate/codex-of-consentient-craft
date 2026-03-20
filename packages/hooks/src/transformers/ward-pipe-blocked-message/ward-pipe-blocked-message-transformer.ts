/**
 * PURPOSE: Produces an error message when ward output is piped, explaining why piping loses information
 *
 * USAGE:
 * wardPipeBlockedMessageTransformer({ command: 'npm run ward | grep error' });
 * // Returns error message with alternative approaches
 */
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { errorMessageContract } from '@dungeonmaster/shared/contracts';

export const wardPipeBlockedMessageTransformer = ({ command }: { command: string }): ErrorMessage =>
  errorMessageContract.parse(
    `Blocked: piping ward output loses valuable information.\n` +
      `You ran: \`${command}\`\n\n` +
      `Ward already provides structured output with summaries and the \`detail\` subcommand for full errors.\n\n` +
      `Instead, try:\n` +
      `  npm run ward -- --only lint                           # Scope to specific check type\n` +
      `  npm run ward -- --only unit -- path/to/file.test.ts   # Scope to specific file\n` +
      `  npm run ward -- --only unit --onlyTests "test name"   # Scope to specific test name\n` +
      `  npm run ward -- detail <runId> <filePath>             # Get full error details for a file`,
  );
