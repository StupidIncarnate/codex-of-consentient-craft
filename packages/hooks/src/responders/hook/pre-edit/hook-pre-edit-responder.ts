/**
 * PURPOSE: Handles pre-edit hook events by checking for new ESLint violations
 *
 * USAGE:
 * const result = await HookPreEditResponder({ input: hookData });
 * // Returns { shouldBlock: boolean, message?: string } indicating whether to block the edit
 */
import { violationsCheckNewBroker } from '../../../brokers/violations/check-new/violations-check-new-broker';
import { preToolUseHookDataContract } from '../../../contracts/pre-tool-use-hook-data/pre-tool-use-hook-data-contract';
import type { HookData } from '../../../contracts/hook-data/hook-data-contract';

export interface HookPreEditResponderResult {
  shouldBlock: boolean;
  message?: string;
}

/**
 * Responder for pre-edit hook events.
 *
 * Validates hook data and checks for newly introduced ESLint violations
 * before allowing an edit operation to proceed.
 *
 * @param params - The parameters object
 * @param params.input - The hook data from stdin
 * @returns Promise with result indicating whether to block the edit
 * @throws Error when hook event is not supported
 */
export const HookPreEditResponder = async ({
  input,
}: {
  input: HookData;
}): Promise<HookPreEditResponderResult> => {
  // Validate and parse as PreToolUse hook data
  const parseResult = preToolUseHookDataContract.safeParse(input);

  if (!parseResult.success) {
    throw new Error(`Unsupported hook event: ${input.hook_event_name}`);
  }

  const hookData = parseResult.data;

  // Check for newly introduced violations
  const result = await violationsCheckNewBroker({
    toolInput: hookData.tool_input,
    cwd: hookData.cwd,
  });

  if (result.hasNewViolations) {
    return {
      shouldBlock: true,
      message: result.message ?? 'New violations detected',
    };
  }

  return {
    shouldBlock: false,
  };
};
