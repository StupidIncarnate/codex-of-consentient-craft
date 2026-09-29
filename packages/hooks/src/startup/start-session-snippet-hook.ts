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

import { argv, exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';

import { HookSessionSnippetFlow } from '../flows/hook-session-snippet/hook-session-snippet-flow';

const [, , snippetKey] = argv;

export const StartSessionSnippetHook = async ({
  snippetKeyArg,
  inputData,
}: {
  snippetKeyArg: string | undefined;
  inputData: string;
}): Promise<void> => {
  const hookInput: unknown = JSON.parse(inputData);
  const result = await HookSessionSnippetFlow({ snippetKey: snippetKeyArg, hookInput });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  exit(result.exitCode);
};

readStdinToEnd()
  .then(async (inputData) => StartSessionSnippetHook({ snippetKeyArg: snippetKey, inputData }))
  .catch(() => exit(1));
