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

  const hasViolations = newlyIntroduced.length > 0;

  if (!hasViolations) {
    return {
      hasNewViolations: false,
      newViolations: newlyIntroduced,
    };
  }

  const hasConfigAndData = config !== undefined && hookData !== undefined;
  const violationMessage = hasConfigAndData
    ? MessageFormatter.formatViolationMessage({
        violations: newlyIntroduced,
        config,
        hookData,
      })
    : formatViolationMessage({ violations: newlyIntroduced });

  const result: ViolationComparison = {
    hasNewViolations: hasViolations,
    newViolations: newlyIntroduced,
  };

  if (violationMessage !== '') {
    result.message = violationMessage;
  }

  return result;
};
