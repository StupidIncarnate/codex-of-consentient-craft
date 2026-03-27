/**
 * PURPOSE: Strips pipe and everything after it from a ward command, preserving the ward invocation
 *
 * USAGE:
 * stripWardPipeCommandTransformer({ command: 'npm run ward -- --only unit | tail -80' });
 * // Returns 'npm run ward -- --only unit'
 */
import type { BashToolInput } from '../../contracts/bash-tool-input/bash-tool-input-contract';

import { bashToolInputContract } from '../../contracts/bash-tool-input/bash-tool-input-contract';

// Matches "npm run ward" followed by optional args, then a pipe (not inside quotes)
const WARD_PIPE_SPLIT = /^(.*npm\s+run\s+ward\b[^"']*?)\s*\|.*$/u;

export const stripWardPipeCommandTransformer = ({
  command,
}: {
  command: string;
}): BashToolInput['command'] => {
  const match = WARD_PIPE_SPLIT.exec(command);

  if (!match?.[1]) {
    return bashToolInputContract.shape.command.parse(command);
  }

  return bashToolInputContract.shape.command.parse(match[1].trim());
};
