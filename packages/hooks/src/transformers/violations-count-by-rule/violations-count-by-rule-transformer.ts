import type { LintResult } from '../../contracts/lint-result/lint-result-contract';
import type { ViolationCount } from '../../contracts/violation-count/violation-count-contract';
import type { ViolationDetail } from '../../contracts/violation-detail/violation-detail-contract';
import { violationDetailContract } from '../../contracts/violation-detail/violation-detail-contract';
import { violationCountContract } from '../../contracts/violation-count/violation-count-contract';

const ERROR_SEVERITY = 2;

export const violationsCountByRuleTransformer = ({
  results,
}: {
  results: LintResult[];
}): ViolationCount[] => {
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
          violationList.push(
            violationDetailContract.parse({
              ruleId: message.ruleId,
              line: message.line,
              column: message.column,
              message: message.message,
            }),
          );
        }
      }
    }
  }

  return Array.from(violationMap.entries()).map(([ruleId, details]) =>
    violationCountContract.parse({
      ruleId,
      count: details.length,
      details,
    }),
  );
};
