/**
 * PURPOSE: Handles pre-bash hook events by checking if a command is a blocked quality tool invocation
 *
 * USAGE:
 * const result = HookPreBashResponder({ input: hookData });
 * // Returns { shouldBlock: boolean, message?: string } indicating whether to block the bash command
 */
import { isBlockedQualityCommandGuard } from '../../../guards/is-blocked-quality-command/is-blocked-quality-command-guard';
import { isWardPipedCommandGuard } from '../../../guards/is-ward-piped-command/is-ward-piped-command-guard';
import { isWardCommandGuard } from '../../../guards/is-ward-command/is-ward-command-guard';
import { wardSuggestionMessageTransformer } from '../../../transformers/ward-suggestion-message/ward-suggestion-message-transformer';
import { stripWardPipeCommandTransformer } from '../../../transformers/strip-ward-pipe-command/strip-ward-pipe-command-transformer';
import { bashToolInputContract } from '../../../contracts/bash-tool-input/bash-tool-input-contract';
import { preToolUseHookDataContract } from '../../../contracts/pre-tool-use-hook-data/pre-tool-use-hook-data-contract';
import { hookPreEditResponderResultContract } from '../../../contracts/hook-pre-edit-responder-result/hook-pre-edit-responder-result-contract';
import { wardTimeoutStatics } from '../../../statics/ward-timeout/ward-timeout-statics';
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

  const { command, timeout } = parseResult.data;

  const isPiped = isWardPipedCommandGuard({ command });

  if (isPiped) {
    const strippedCommand = stripWardPipeCommandTransformer({ command });

    return hookPreEditResponderResultContract.parse({
      shouldBlock: false,
      updatedCommand: strippedCommand,
    });
  }

  const isBlocked = isBlockedQualityCommandGuard({ command });

  if (isBlocked) {
    return hookPreEditResponderResultContract.parse({
      shouldBlock: true,
      message: wardSuggestionMessageTransformer({ command: parseResult.data.command }),
    });
  }

  const isWard = isWardCommandGuard({ command });

  if (isWard && (!timeout || timeout < wardTimeoutStatics.minimumTimeout)) {
    return hookPreEditResponderResultContract.parse({
      shouldBlock: false,
      updatedTimeout: wardTimeoutStatics.minimumTimeout,
    });
  }

  return hookPreEditResponderResultContract.parse({
    shouldBlock: false,
  });
};
