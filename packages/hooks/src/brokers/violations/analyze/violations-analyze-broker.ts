import type { LintResult, ViolationComparison } from '../../../types/lint-type';
import type { PreEditLintConfig } from '../../../types/config-type';
import { MessageFormatter } from '../../../pre-edit-lint/message-formatter';
import { violationsCountByRuleTransformer } from '../../../transformers/violations-count-by-rule/violations-count-by-rule-transformer';
import { violationsFindNewTransformer } from '../../../transformers/violations-find-new/violations-find-new-transformer';
import { violationMessageFormatTransformer } from '../../../transformers/violation-message-format/violation-message-format-transformer';

export const violationsAnalyzeBroker = ({
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
  const oldViolations = violationsCountByRuleTransformer({ results: oldResults });
  const newViolations = violationsCountByRuleTransformer({ results: newResults });

  const newlyIntroduced = violationsFindNewTransformer({
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
    : violationMessageFormatTransformer({ violations: newlyIntroduced });

  const result: ViolationComparison = {
    hasNewViolations: hasViolations,
    newViolations: newlyIntroduced,
  };

  if (violationMessage !== '') {
    result.message = violationMessage;
  }

  return result;
};
