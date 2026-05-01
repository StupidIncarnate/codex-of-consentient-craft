#!/usr/bin/env node
/**
 * PURPOSE: Entry point for session snippet hook that outputs a specific architecture snippet by key
 *
 * USAGE:
 * echo '{"hook_event_name":"SessionStart",...}' | npx tsx start-session-snippet-hook.ts discover
 * // Reads snippet key from argv[2], parses stdin hook data, outputs snippet content to stdout
 * // For SubagentStart: wraps output in JSON with additionalContext for sub-agent injection
 * // For SessionStart: outputs raw XML-tagged text
 *
 * WHEN-TO-USE: Called by Claude CLI as a SessionStart or SubagentStart hook for each registered snippet key
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { HookSessionSnippetFlow } from '../flows/hook-session-snippet/hook-session-snippet-flow';

const [, , snippetKey] = process.argv;

export const StartSessionSnippetHook = async ({
  snippetKeyArg,
  inputData,
}: {
  snippetKeyArg: string | undefined;
  inputData: string;
}): Promise<AdapterResult> => {
  const hookInput: unknown = JSON.parse(inputData);
  const result = await HookSessionSnippetFlow({ snippetKey: snippetKeyArg, hookInput });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartSessionSnippetHook({ snippetKeyArg: snippetKey, inputData: inputBuffer.data }).catch(() =>
    process.exit(1),
  );
});
