/**
 * PURPOSE: Wraps snippet content in SubagentStart JSON envelope for Claude CLI sub-agent context injection
 *
 * USAGE:
 * const json = wrapSubagentStartOutputTransformer({ content: stdoutContent });
 * // Returns Stdout containing JSON: { hookSpecificOutput: { hookEventName, additionalContext } }
 *
 * WHEN-TO-USE: When a session snippet hook is invoked for a SubagentStart event
 */

import type { ExecResult } from '@dungeonmaster/shared/contracts';
import { execResultContract } from '@dungeonmaster/shared/contracts';

export const wrapSubagentStartOutputTransformer = ({
  content,
}: {
  content: ExecResult['stdout'];
}): ExecResult['stdout'] =>
  execResultContract.shape.stdout.parse(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SubagentStart',
        additionalContext: String(content),
      },
    }),
  );
