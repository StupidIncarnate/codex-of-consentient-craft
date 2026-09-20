/**
 * PURPOSE: Parses raw JSON input from Antigravity Stop hook stdin, delegates to HookAgyStopResponder,
 * and produces process output (ExecResult) with JSON decision on stdout
 *
 * USAGE:
 * const result = await HookAgyStopFlow({ inputData: '{"fullyIdle":false,...}' });
 * // Returns ExecResult with stdout: JSON string of AgyStopDecision, exitCode: 0
 */

import { execResultContract, type ExecResult } from '@dungeonmaster/shared/contracts';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import { HookAgyStopResponder } from '../../responders/hook/agy-stop/hook-agy-stop-responder';

export const HookAgyStopFlow = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  try {
    const parseResult = safeJsonParseTransformer({ value: inputData });
    const hookInput = parseResult.ok ? parseResult.value : null;

    const decision = await HookAgyStopResponder({ hookInput });

    return execResultContract.parse({
      stdout: JSON.stringify(decision),
      stderr: '',
      exitCode: 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return execResultContract.parse({
      stderr: `Hook error: ${message}\n${stack ? `${stack}\n` : ''}`,
      stdout: JSON.stringify({ decision: 'stop' }),
      exitCode: 0,
    });
  }
};
