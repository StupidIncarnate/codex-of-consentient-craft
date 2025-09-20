import type { LintResult, ViolationCount, ViolationDetail } from '../../types/lint-type';

export const countViolationsByRule = ({ results }: { results: LintResult[] }): ViolationCount[] => {
  const violationMap = new Map<string, ViolationDetail[]>();

  for (const result of results) {
    for (const message of result.messages) {
      if (message.severity === 2 && message.ruleId) {
        // Only count errors (severity 2), not warnings
        if (!violationMap.has(message.ruleId)) {
          violationMap.set(message.ruleId, []);
        }

        violationMap.get(message.ruleId)!.push({
          ruleId: message.ruleId,
          line: message.line,
          column: message.column,
          message: message.message,
        });
      }
    }
  }

  return Array.from(violationMap.entries()).map(([ruleId, details]) => ({
    ruleId,
    count: details.length,
    details,
  }));
};
