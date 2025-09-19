import type { LintResult, ViolationComparison } from '../../types/lint-type';
import type { PreEditLintConfig } from '../../types/config-type';
import { MessageFormatter } from '../../pre-edit-lint/message-formatter';
import { violationAnalyzerUtilCountViolationsByRule } from './violation-analyzer-util-count-violations-by-rule';
import { violationAnalyzerUtilFindNewViolations } from './violation-analyzer-util-find-new-violations';
import { violationAnalyzerUtilFormatViolationMessage } from './violation-analyzer-util-format-violation-message';

export const violationAnalyzerUtilHasNewViolations = ({
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
  const oldViolations = violationAnalyzerUtilCountViolationsByRule({ results: oldResults });
  const newViolations = violationAnalyzerUtilCountViolationsByRule({ results: newResults });

  const newlyIntroduced = violationAnalyzerUtilFindNewViolations({
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
      message = violationAnalyzerUtilFormatViolationMessage({ violations: newlyIntroduced });
    }
  }

  return {
    hasNewViolations,
    newViolations: newlyIntroduced,
    message,
  };
};
