/**
 * PURPOSE: Handles post-edit hook events by running ESLint auto-fix and reporting remaining errors
 *
 * USAGE:
 * const result = await HookPostEditResponder({ input: hookData });
 * // Returns { violations: LintResult[], message: string } with error-level violations after auto-fix
 */
import { violationsFixAndReportBroker } from '../../../brokers/violations/fix-and-report/violations-fix-and-report-broker';
import { postToolUseHookDataContract } from '../../../contracts/post-tool-use-hook-data/post-tool-use-hook-data-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { HookData } from '../../../contracts/hook-data/hook-data-contract';
import type { HookPostEditResponderResult } from '../../../contracts/hook-post-edit-responder-result/hook-post-edit-responder-result-contract';

/**
 * Responder for post-edit hook events.
 *
 * Validates hook data and runs ESLint with auto-fix on the modified file,
 * reporting only error-level violations that remain after auto-fixing.
 *
 * @param params - The parameters object
 * @param params.input - The hook data from stdin
 * @returns Promise with violations and message (never blocks)
 * @throws Error when hook event is not supported
 */
export const HookPostEditResponder = async ({
  input,
}: {
  input: HookData;
}): Promise<HookPostEditResponderResult> => {
  // Validate and parse as PostToolUse hook data
  const parseResult = postToolUseHookDataContract.safeParse(input);

  if (!parseResult.success) {
    throw new Error(`Unsupported hook event: ${input.hook_event_name}`);
  }

  const hookData = parseResult.data;

  // Run auto-fix and report remaining violations
  const result = await violationsFixAndReportBroker({
    toolInput: hookData.tool_input,
    cwd: filePathContract.parse(hookData.cwd),
  });

  return result;
};
