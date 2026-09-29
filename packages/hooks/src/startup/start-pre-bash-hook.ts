#!/usr/bin/env node
/**
 * PURPOSE: Entry point for pre-bash hook that blocks direct jest/eslint/tsc invocations
 *
 * USAGE:
 * echo '{"hook_event_name":"PreToolUse",...}' | node start-pre-bash-hook.ts
 * // Reads JSON from stdin, validates, checks if command is blocked, exits with code 2 if blocked
 */

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { HookPreBashFlow } from '../flows/hook-pre-bash/hook-pre-bash-flow';

export const StartPreBashHook = ({ inputData }: { inputData: string }): AdapterResult => {
  const result = HookPreBashFlow({ inputData });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  return exit(result.exitCode);
};

readStdinToEnd()
  .then((inputData) => StartPreBashHook({ inputData }))
  .catch(() => exit(1));
