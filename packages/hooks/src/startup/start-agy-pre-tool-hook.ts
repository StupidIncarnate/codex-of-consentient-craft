#!/usr/bin/env node
/**
 * PURPOSE: Entry point for Antigravity PreToolUse hook that blocks bad tools/commands and audits edits
 *
 * USAGE:
 * echo '{"toolCall":...}' | node start-agy-pre-tool-hook.ts
 * // Reads JSON from stdin, delegates to HookAgyPreToolFlow, outputs JSON decision to stdout
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { HookAgyPreToolFlow } from '../flows/hook-agy-pre-tool/hook-agy-pre-tool-flow';

export const StartAgyPreToolHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<AdapterResult> => {
  const result = await HookAgyPreToolFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartAgyPreToolHook({ inputData: inputBuffer.data }).catch(() => process.exit(1));
});
