/**
 * PURPOSE: Delegates raw stdin payload to the post-ask-question responder and produces process output. Uses exit 2 on real failures so Claude Code feeds stderr back to Claude (blocking) — design decision persistence is load-bearing for ChaosWhisperer's flow, so silent failure would corrupt quest state.
 *
 * USAGE:
 * const result = await HookPostAskQuestionFlow({ inputData: rawHookJson });
 * // Returns ExecResult with stdout, stderr, exitCode (0 on success, 2 on failure).
 */

import {
  execResultContract,
  type ExecResult,
} from '../../contracts/exec-result/exec-result-contract';
import { HookPostAskQuestionResponder } from '../../responders/hook/post-ask-question/hook-post-ask-question-responder';
import { hookExitCodeStatics } from '../../statics/hook-exit-code/hook-exit-code-statics';

export const HookPostAskQuestionFlow = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  const result = await HookPostAskQuestionResponder({ inputData }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[post-ask-question] ${message}\n`);
    return execResultContract.parse({
      stdout: '',
      stderr: message,
      exitCode: hookExitCodeStatics.blockingFailure,
    });
  });

  return result;
};
