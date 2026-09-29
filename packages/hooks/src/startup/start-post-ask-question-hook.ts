#!/usr/bin/env node
/**
 * PURPOSE: Entry point for the PostToolUse hook on the native AskUserQuestion tool. Reads JSON from stdin, delegates to HookPostAskQuestionFlow, writes any stdout the flow produced, and exits with the flow's exitCode (0 on success, 2 on failure — blocking, surfaces stderr back to Claude).
 *
 * USAGE:
 * echo '{"hook_event_name":"PostToolUse",...}' | node start-post-ask-question-hook.js
 * // Delegates payload to the flow, exits with the flow's exitCode
 */

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';

import { HookPostAskQuestionFlow } from '../flows/hook-post-ask-question/hook-post-ask-question-flow';
import { hookExitCodeStatics } from '../statics/hook-exit-code/hook-exit-code-statics';

export const StartPostAskQuestionHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<void> => {
  const result = await HookPostAskQuestionFlow({ inputData });
  stdout.write(result.stdout);
  exit(result.exitCode);
};

readStdinToEnd()
  .then(async (inputData) => StartPostAskQuestionHook({ inputData }))
  .catch((error: unknown) => {
    stderr.write(`[post-ask-question] startup error: ${String(error)}\n`);
    exit(hookExitCodeStatics.blockingFailure);
  });
