/**
 * PURPOSE: Wraps text in the PostToolUse JSON envelope Claude Code reads from a hook's stdout, so
 * the text reaches the model as context beside the tool result without blocking anything. Reach
 * for this over wrapSubagentStartOutputTransformer when the hook fires on PostToolUse.
 *
 * USAGE:
 * const json = wrapPostToolUseOutputTransformer({ content: 'gateway-sync added left-pad' });
 * // Returns '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"gateway-sync added left-pad"}}'
 */

import type { ExecResult } from '@dungeonmaster/shared/contracts';
import { execResultContract } from '@dungeonmaster/shared/contracts';

export const wrapPostToolUseOutputTransformer = ({
  content,
}: {
  content: string;
}): ExecResult['stdout'] =>
  execResultContract.shape.stdout.parse(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: content,
      },
    }),
  );
