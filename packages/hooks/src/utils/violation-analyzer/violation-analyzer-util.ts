import { violationAnalyzerUtilCountViolationsByRule } from './violation-analyzer-util-count-violations-by-rule';
import { violationAnalyzerUtilFindNewViolations } from './violation-analyzer-util-find-new-violations';
import { violationAnalyzerUtilFormatViolationMessage } from './violation-analyzer-util-format-violation-message';
import { violationAnalyzerUtilHasNewViolations } from './violation-analyzer-util-has-new-violations';

export const ViolationAnalyzerUtil = {
  countViolationsByRule: violationAnalyzerUtilCountViolationsByRule,
  findNewViolations: violationAnalyzerUtilFindNewViolations,
  formatViolationMessage: violationAnalyzerUtilFormatViolationMessage,
  hasNewViolations: violationAnalyzerUtilHasNewViolations,
};
