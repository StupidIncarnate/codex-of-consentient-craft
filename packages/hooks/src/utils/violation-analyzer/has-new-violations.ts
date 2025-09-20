import type { LintResult, ViolationComparison } from '../../types/lint-type';
import type { PreEditLintConfig } from '../../types/config-type';
import { MessageFormatter } from '../../pre-edit-lint/message-formatter';
import { countViolationsByRule } from './count-violations-by-rule';
import { findNewViolations } from './find-new-violations';
import { formatViolationMessage } from './format-violation-message';

export const hasNewViolations = ({
  oldResults,
  newResults,
  config,
  hookData,
}: {
  oldResults: LintResult[];
  newResults: LintResult[];
  config?: PreEditLintConfig;
  hookData?: unknown;
}): ViolationComparison => {
  const oldViolations = countViolationsByRule({ results: oldResults });
  const newViolations = countViolationsByRule({ results: newResults });

  const newlyIntroduced = findNewViolations({
    oldViolations,
    newViolations,
  });

  const hasNewViolations = newlyIntroduced.length > 0;

  let message: string | undefined;
  if (hasNewViolations) {
    if (config && hookData) {
      // Use the message formatter for custom messages
      message = MessageFormatter.formatViolationMessage({
        violations: newlyIntroduced,
        config,
        hookData,
      });
    } else {
      // Fall back to default formatting
      message = formatViolationMessage({ violations: newlyIntroduced });
    }
  }

  return {
    hasNewViolations,
    newViolations: newlyIntroduced,
    message,
  };
};
