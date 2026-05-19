/**
 * PURPOSE: Defines the input schema for the MCP register-monitor-session tool /dumpster-launch calls at startup
 *
 * USAGE:
 * registerMonitorSessionInputContract.parse({ sessionFilePath: '/home/user/.claude/projects/.../foo.jsonl' });
 * // Returns: validated RegisterMonitorSessionInput
 */
import { z } from 'zod';

import { absolutePathContract } from '../absolute-path/absolute-path-contract';

// Keep MCP's existing bare-brand absolutePathContract — the path is whatever the user's
// shell resolves their session JSONL to. Stricter shared variants would reject paths
// that real Claude Code session JSONLs use.
export const registerMonitorSessionInputContract = z
  .object({
    sessionFilePath: absolutePathContract.describe(
      'Absolute path to the /dumpster-launch session JSONL file under ~/.claude/projects/<encoded-cwd>/',
    ),
  })
  .strict();

export type RegisterMonitorSessionInput = z.infer<typeof registerMonitorSessionInputContract>;
