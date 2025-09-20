import { countViolationsByRule } from './count-violations-by-rule';
import { findNewViolations } from './find-new-violations';
import { formatViolationMessage } from './format-violation-message';
import { hasNewViolations } from './has-new-violations';

export const ViolationAnalyzerUtil = {
  countViolationsByRule: countViolationsByRule,
  findNewViolations: findNewViolations,
  formatViolationMessage: formatViolationMessage,
  hasNewViolations: hasNewViolations,
};
