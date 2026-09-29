#!/usr/bin/env node
/**
 * PURPOSE: Entry point for pre-edit hook that validates and processes tool use events
 *
 * USAGE:
 * echo '{"hook_event_name":"PreToolUse",...}' | node start-pre-edit-hook.ts
 * // Reads JSON from stdin, validates, checks violations, exits with code 2 if blocked
 */

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';

import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';

export const StartPreEditHook = async ({ inputData }: { inputData: string }): Promise<void> => {
  const result = await HookPreEditFlow({ inputData });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  exit(result.exitCode);
};

readStdinToEnd()
  .then(async (inputData) => StartPreEditHook({ inputData }))
  .catch(() => exit(1));
