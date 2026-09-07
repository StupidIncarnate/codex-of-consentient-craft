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

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { HookPreFolderDetailFlow } from '../flows/hook-pre-folder-detail/hook-pre-folder-detail-flow';

export const StartPreFolderDetailHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<AdapterResult> => {
  const result = await HookPreFolderDetailFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartPreFolderDetailHook({ inputData: inputBuffer.data }).catch(() => process.exit(1));
});
