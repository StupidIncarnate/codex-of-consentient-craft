/**
 * PURPOSE: Parses raw JSON input, delegates to the pre-edit hook responder, and produces process output
 *
 * USAGE:
 * const result = await HookPreEditFlow({ inputData: '{"hook_event_name":"PreToolUse",...}' });
 * // Returns ExecResult with stdout, stderr, exitCode
 */

import { execResultContract, type ExecResult } from '@dungeonmaster/shared/contracts';
import { HookPreEditResponder } from '../../responders/hook/pre-edit/hook-pre-edit-responder';
import { hookDataContract } from '../../contracts/hook-data/hook-data-contract';

const EXIT_CODE_BLOCK = 2;

export const HookPreEditFlow = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  try {
    const hookData = hookDataContract.safeParse(JSON.parse(inputData));

    if (!hookData.success) {
      throw new Error('Unsupported hook event: payload is not valid hook data');
    }

    const result = await HookPreEditResponder({
      input: hookData.data,
    });

    return execResultContract.parse({
      stderr: result.shouldBlock ? `${result.message ?? 'New violations detected'}\n` : '',
      stdout: '',
      exitCode: Number(result.shouldBlock) * EXIT_CODE_BLOCK,
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
