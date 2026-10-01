#!/usr/bin/env node
/**
 * PURPOSE: Entry point for the PostToolUse hook on the Bash tool. Reads JSON from stdin, delegates
 * to HookPostBashFlow (which runs `dungeonmaster gateway-sync` after an `npm install <pkg>`), writes
 * the flow's stdout and stderr, and exits 0 even on a startup error, so it never fails a tool call.
 *
 * USAGE:
 * echo '{"hook_event_name":"PostToolUse","tool_name":"Bash",...}' | node start-post-bash-hook.js
 * // Writes the PostToolUse JSON when a sync ran, nothing otherwise; exits 0
 */

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';

import { HookPostBashFlow } from '../flows/hook-post-bash/hook-post-bash-flow';
import { hookExitCodeStatics } from '../statics/hook-exit-code/hook-exit-code-statics';

export const StartPostBashHook = async ({ inputData }: { inputData: string }): Promise<void> => {
  const result = await HookPostBashFlow({ inputData });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  exit(result.exitCode);
};

readStdinToEnd()
  .then(async (inputData) => StartPostBashHook({ inputData }))
  .catch((error: unknown) => {
    stderr.write(`[post-bash] startup error: ${String(error)}\n`);
    exit(hookExitCodeStatics.success);
  });
