/**
 * PURPOSE: Turns the raw PreToolUse stdin payload into the process result that decides a Write,
 * mapping only a confirmed block to the blocking exit code. Every other outcome — a parse failure,
 * a responder throw, an unreadable transcript — leaves exit code 0 or 1, both of which Claude Code
 * treats as "allow", so a bug in this hook can never make the repo unwritable.
 *
 * USAGE:
 * const result = await HookPreFolderDetailFlow({ inputData: '{"hook_event_name":"PreToolUse",...}' });
 * // Returns ExecResult with stdout, stderr, exitCode (2 only when the write is blocked)
 */

import { execResultContract, type ExecResult } from '@dungeonmaster/shared/contracts';
import { HookPreFolderDetailResponder } from '../../responders/hook/pre-folder-detail/hook-pre-folder-detail-responder';
import { folderDetailBlockMessageStatics } from '../../statics/folder-detail-block-message/folder-detail-block-message-statics';
import { hookExitCodeStatics } from '../../statics/hook-exit-code/hook-exit-code-statics';

const EXIT_CODE_NON_BLOCKING_ERROR = 1;

export const HookPreFolderDetailFlow = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  try {
    const parsed: unknown = JSON.parse(inputData);

    const result = await HookPreFolderDetailResponder({ input: parsed });

    return execResultContract.parse({
      stderr: result.shouldBlock
        ? `${result.message ?? folderDetailBlockMessageStatics.header}\n`
        : '',
      stdout: '',
      exitCode: result.shouldBlock
        ? hookExitCodeStatics.blockingFailure
        : hookExitCodeStatics.success,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return execResultContract.parse({
      stderr: `Hook error: ${message}\n${stack ? `${stack}\n` : ''}`,
      stdout: '',
      exitCode: EXIT_CODE_NON_BLOCKING_ERROR,
    });
  }
};
