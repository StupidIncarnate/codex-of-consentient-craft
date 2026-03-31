/**
 * PURPOSE: Handles pre-search hook events by checking if Grep/Glob should be blocked in favor of discover
 *
 * USAGE:
 * const result = HookPreSearchResponder({ input: hookData });
 * // Returns { shouldBlock: false } for content searches, { shouldBlock: true, message: '...' } for exploratory searches
 */
import { preSearchHookDataContract } from '../../../contracts/pre-search-hook-data/pre-search-hook-data-contract';
import { grepToolInputContract } from '../../../contracts/grep-tool-input/grep-tool-input-contract';
import { globToolInputContract } from '../../../contracts/glob-tool-input/glob-tool-input-contract';
import { hookPreEditResponderResultContract } from '../../../contracts/hook-pre-edit-responder-result/hook-pre-edit-responder-result-contract';
import { discoverSuggestionMessageStatics } from '../../../statics/discover-suggestion-message/discover-suggestion-message-statics';
import { isAllowedGrepSearchGuard } from '../../../guards/is-allowed-grep-search/is-allowed-grep-search-guard';
import { isAllowedGlobSearchGuard } from '../../../guards/is-allowed-glob-search/is-allowed-glob-search-guard';
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

  const { tool_name, tool_input } = parseResult.data;

  if (String(tool_name) === 'Grep') {
    const grepResult = grepToolInputContract.safeParse(tool_input);

    if (grepResult.success && isAllowedGrepSearchGuard({ input: grepResult.data })) {
      return hookPreEditResponderResultContract.parse({
        shouldBlock: false,
      });
    }
  }

  if (String(tool_name) === 'Glob') {
    const globResult = globToolInputContract.safeParse(tool_input);

    if (globResult.success && isAllowedGlobSearchGuard({ input: globResult.data })) {
      return hookPreEditResponderResultContract.parse({
        shouldBlock: false,
      });
    }
  }

  return hookPreEditResponderResultContract.parse({
    shouldBlock: true,
    message: discoverSuggestionMessageStatics.blockMessage,
  });
};
