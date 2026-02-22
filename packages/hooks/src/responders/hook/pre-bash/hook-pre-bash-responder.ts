/**
 * PURPOSE: Handles pre-bash hook events by checking if a command is a blocked quality tool invocation
 *
 * USAGE:
 * const result = HookPreBashResponder({ input: hookData });
 * // Returns { shouldBlock: boolean, message?: string } indicating whether to block the bash command
 */
import { isBlockedQualityCommandGuard } from '../../../guards/is-blocked-quality-command/is-blocked-quality-command-guard';
import { wardSuggestionMessageTransformer } from '../../../transformers/ward-suggestion-message/ward-suggestion-message-transformer';
import { bashToolInputContract } from '../../../contracts/bash-tool-input/bash-tool-input-contract';
import { preToolUseHookDataContract } from '../../../contracts/pre-tool-use-hook-data/pre-tool-use-hook-data-contract';
import { hookPreEditResponderResultContract } from '../../../contracts/hook-pre-edit-responder-result/hook-pre-edit-responder-result-contract';
import type { HookData } from '../../../contracts/hook-data/hook-data-contract';
import type { HookPreEditResponderResult } from '../../../contracts/hook-pre-edit-responder-result/hook-pre-edit-responder-result-contract';

export const HookPreBashResponder = ({
  input,
}: {
  input: HookData;
}): HookPreEditResponderResult => {
  const preToolUseResult = preToolUseHookDataContract.safeParse(input);

  if (!preToolUseResult.success) {
    return hookPreEditResponderResultContract.parse({
      shouldBlock: false,
    });
  }

  const toolInput: unknown = preToolUseResult.data.tool_input;
  const parseResult = bashToolInputContract.safeParse(toolInput);

  if (!parseResult.success) {
    return hookPreEditResponderResultContract.parse({
      shouldBlock: false,
    });
  }

  const { command } = parseResult.data;

  const isBlocked = isBlockedQualityCommandGuard({ command });

  if (isBlocked) {
    return hookPreEditResponderResultContract.parse({
      shouldBlock: true,
      message: wardSuggestionMessageTransformer({ command: parseResult.data.command }),
    });
  }

  return hookPreEditResponderResultContract.parse({
    shouldBlock: false,
  });
};
