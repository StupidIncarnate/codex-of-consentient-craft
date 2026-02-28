/**
 * PURPOSE: Parses raw JSON input, delegates to the post-edit hook responder, and produces process output
 *
 * USAGE:
 * const result = await HookPostEditFlow({ inputData: '{"hook_event_name":"PostToolUse",...}' });
 * // Returns ExecResult with stdout, stderr, exitCode
 */

import {
  execResultContract,
  type ExecResult,
} from '../../contracts/exec-result/exec-result-contract';
import { HookPostEditResponder } from '../../responders/hook/post-edit/hook-post-edit-responder';

export const HookPostEditFlow = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  try {
    const parsed: unknown = JSON.parse(inputData);

    const result = await HookPostEditResponder({
      input: parsed as Parameters<typeof HookPostEditResponder>[0]['input'],
    });

    const shouldBlock =
      result.violations.length > 0 && result.message !== 'All violations auto-fixed successfully';

    return execResultContract.parse({
      stderr: `${result.message}\n`,
      stdout: shouldBlock ? JSON.stringify({ decision: 'block', reason: result.message }) : '',
      exitCode: 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return execResultContract.parse({
      stderr: `Hook error: ${message}\n${stack ? `${stack}\n` : ''}`,
      stdout: '',
      exitCode: 1,
    });
  }
};
