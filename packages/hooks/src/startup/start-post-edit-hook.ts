#!/usr/bin/env node
/**
 * PURPOSE: Entry point for post-edit hook that runs ESLint auto-fix and reports remaining errors
 *
 * USAGE:
 * echo '{"hook_event_name":"PostToolUse",...}' | node start-post-edit-hook.ts
 * // Reads JSON from stdin, runs auto-fix, reports remaining error-level violations, exits with code 0
 */

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { HookPostEditFlow } from '../flows/hook-post-edit/hook-post-edit-flow';

export const StartPostEditHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<AdapterResult> => {
  const result = await HookPostEditFlow({ inputData });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  return exit(result.exitCode);
};

readStdinToEnd()
  .then(async (inputData) => StartPostEditHook({ inputData }))
  .catch(() => exit(1));
