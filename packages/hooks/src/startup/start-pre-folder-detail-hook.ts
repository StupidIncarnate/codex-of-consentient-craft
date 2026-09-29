#!/usr/bin/env node
/**
 * PURPOSE: Entry point for the hook that gates a Write on get-folder-detail having been called for
 * that folder type. The outer .catch exits 1 rather than rethrowing, because an unhandled rejection
 * would exit non-zero in a way Claude Code could surface as a block — and this hook must never
 * block on its own failure.
 *
 * USAGE:
 * echo '{"hook_event_name":"PreToolUse",...}' | node start-pre-folder-detail-hook.js
 * // Reads JSON from stdin, exits 2 only when the folder type was never loaded this session
 */

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { HookPreFolderDetailFlow } from '../flows/hook-pre-folder-detail/hook-pre-folder-detail-flow';

export const StartPreFolderDetailHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<AdapterResult> => {
  const result = await HookPreFolderDetailFlow({ inputData });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  return exit(result.exitCode);
};

readStdinToEnd()
  .then(async (inputData) => StartPreFolderDetailHook({ inputData }))
  .catch(() => exit(1));
