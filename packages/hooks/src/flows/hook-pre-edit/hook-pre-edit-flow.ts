/**
 * PURPOSE: Parses raw JSON input, delegates to the pre-edit hook responder, and produces process output
 *
 * USAGE:
 * const result = await HookPreEditFlow({ inputData: '{"hook_event_name":"PreToolUse",...}' });
 * // Returns ExecResult with stdout, stderr, exitCode
 */

import {
  execResultContract,
  type ExecResult,
} from '../../contracts/exec-result/exec-result-contract';
import { HookPreEditResponder } from '../../responders/hook/pre-edit/hook-pre-edit-responder';

const EXIT_CODE_BLOCK = 2;

export const HookPreEditFlow = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  try {
    const parsed: unknown = JSON.parse(inputData);

    const result = await HookPreEditResponder({
      input: parsed as Parameters<typeof HookPreEditResponder>[0]['input'],
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
