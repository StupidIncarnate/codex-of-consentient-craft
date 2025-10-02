import type { LintResult, ViolationCount, ViolationDetail } from '../../types/lint-type';

const ERROR_SEVERITY = 2;

export const countViolationsByRule = ({ results }: { results: LintResult[] }): ViolationCount[] => {
  const violationMap = new Map<string, ViolationDetail[]>();

  for (const result of results) {
    for (const message of result.messages) {
      if (message.severity === ERROR_SEVERITY && message.ruleId !== undefined) {
        // Only count errors (severity 2), not warnings
        if (!violationMap.has(message.ruleId)) {
          violationMap.set(message.ruleId, []);
        }

        const violationList = violationMap.get(message.ruleId);
        if (violationList !== undefined) {
          violationList.push({
            ruleId: message.ruleId,
            line: message.line,
            column: message.column,
            message: message.message,
          });
        }
      }
    }
  }

  return Array.from(violationMap.entries()).map(([ruleId, details]) => ({
    ruleId,
    count: details.length,
    details,
  }));
};
