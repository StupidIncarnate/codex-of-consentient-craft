/**
 * PURPOSE: Delegates the raw PostToolUse Bash payload to the post-bash responder and turns anything
 * it throws (an unparseable payload) into exit 0 with the reason on stderr. The Bash command has
 * already run, and a gateway sync that could not start is no reason to report the tool call failed.
 *
 * USAGE:
 * const result = await HookPostBashFlow({ inputData: rawHookJson });
 * // Returns ExecResult with stdout, stderr and exitCode 0
 */

import { execResultContract, type ExecResult } from '@dungeonmaster/shared/contracts';

import { HookPostBashResponder } from '../../responders/hook/post-bash/hook-post-bash-responder';
import { hookExitCodeStatics } from '../../statics/hook-exit-code/hook-exit-code-statics';

export const HookPostBashFlow = async ({ inputData }: { inputData: string }): Promise<ExecResult> =>
  HookPostBashResponder({ inputData }).catch((error: unknown) =>
    execResultContract.parse({
      stdout: '',
      stderr: `[post-bash] ${error instanceof Error ? error.message : String(error)}\n`,
      exitCode: hookExitCodeStatics.success,
    }),
  );
