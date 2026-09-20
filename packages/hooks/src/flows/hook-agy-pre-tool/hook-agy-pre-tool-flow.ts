/**
 * PURPOSE: Parses raw JSON input from Antigravity PreToolUse hook stdin, delegates to HookAgyPreToolResponder,
 * and produces process output (ExecResult) with JSON decision on stdout
 *
 * USAGE:
 * const result = await HookAgyPreToolFlow({ inputData: '{"toolCall":...}' });
 * // Returns ExecResult with stdout: JSON string of AgyPreToolDecision, exitCode: 0
 */

import { execResultContract, type ExecResult } from '@dungeonmaster/shared/contracts';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import { HookAgyPreToolResponder } from '../../responders/hook/agy-pre-tool/hook-agy-pre-tool-responder';

export const HookAgyPreToolFlow = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  try {
    const parseResult = safeJsonParseTransformer({ value: inputData });
    const hookInput = parseResult.ok ? parseResult.value : null;

    const decision = await HookAgyPreToolResponder({ hookInput });

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
      stdout: JSON.stringify({ decision: 'allow' }),
      exitCode: 0,
    });
  }
};
