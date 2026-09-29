/**
 * PURPOSE: Parses raw JSON input, delegates to the post-edit hook responder, and produces process output
 *
 * USAGE:
 * const result = await HookPostEditFlow({ inputData: '{"hook_event_name":"PostToolUse",...}' });
 * // Returns ExecResult with stdout, stderr, exitCode
 */

import { execResultContract, type ExecResult } from '@dungeonmaster/shared/contracts';
import { HookPostEditResponder } from '../../responders/hook/post-edit/hook-post-edit-responder';
import { hookDataContract } from '../../contracts/hook-data/hook-data-contract';

export const HookPostEditFlow = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  try {
    const hookData = hookDataContract.safeParse(JSON.parse(inputData));

    if (!hookData.success) {
      throw new Error('Unsupported hook event: payload is not valid hook data');
    }

    const result = await HookPostEditResponder({
      input: hookData.data,
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
