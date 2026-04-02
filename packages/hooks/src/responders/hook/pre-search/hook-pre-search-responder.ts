/**
 * PURPOSE: Handles pre-search hook events by blocking ALL Grep/Glob calls in favor of discover
 *
 * USAGE:
 * const result = HookPreSearchResponder({ input: hookData });
 * // Returns { shouldBlock: true, message: '...' } for all Grep/Glob calls
 */
import { preSearchHookDataContract } from '../../../contracts/pre-search-hook-data/pre-search-hook-data-contract';
import { hookPreEditResponderResultContract } from '../../../contracts/hook-pre-edit-responder-result/hook-pre-edit-responder-result-contract';
import { discoverSuggestionMessageStatics } from '../../../statics/discover-suggestion-message/discover-suggestion-message-statics';
import type { HookPreEditResponderResult } from '../../../contracts/hook-pre-edit-responder-result/hook-pre-edit-responder-result-contract';

export const HookPreSearchResponder = ({
  input,
}: {
  input: unknown;
}): HookPreEditResponderResult => {
  const parseResult = preSearchHookDataContract.safeParse(input);

  if (!parseResult.success) {
    return hookPreEditResponderResultContract.parse({
      shouldBlock: false,
    });
  }

  return hookPreEditResponderResultContract.parse({
    shouldBlock: true,
    message: discoverSuggestionMessageStatics.blockMessage,
  });
};
