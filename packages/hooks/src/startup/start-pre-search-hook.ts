#!/usr/bin/env node
/**
 * PURPOSE: Entry point for pre-search hook that blocks Grep/Glob and suggests the discover MCP tool
 *
 * USAGE:
 * echo '{"hook_event_name":"PreToolUse",...}' | node start-pre-search-hook.ts
 * // Reads JSON from stdin, validates, blocks search tools with exit code 2
 */

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';

import { HookPreSearchFlow } from '../flows/hook-pre-search/hook-pre-search-flow';

export const StartPreSearchHook = ({ inputData }: { inputData: string }): void => {
  const result = HookPreSearchFlow({ inputData });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  exit(result.exitCode);
};

readStdinToEnd()
  .then((inputData) => {
    StartPreSearchHook({ inputData });
  })
  .catch(() => exit(1));
