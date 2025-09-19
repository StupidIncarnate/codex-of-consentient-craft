import type { ViolationCount } from '../../types/lint-type';

export const violationAnalyzerUtilFindNewViolations = ({
  oldViolations,
  newViolations,
}: {
  oldViolations: ViolationCount[];
  newViolations: ViolationCount[];
}): ViolationCount[] => {
  const oldCounts = new Map(oldViolations.map(({ ruleId, count }) => [ruleId, count]));
  const newlyIntroduced: ViolationCount[] = [];

  for (const newViolation of newViolations) {
    const oldCount = oldCounts.get(newViolation.ruleId) || 0;
    if (newViolation.count > oldCount) {
      const newCount = newViolation.count - oldCount;
      // Take the last N details as the "new" violations (simplistic approach)
      const newDetails = newViolation.details.slice(-newCount);

      newlyIntroduced.push({
        ruleId: newViolation.ruleId,
        count: newCount,
        details: newDetails,
      });
    }
  }

  return newlyIntroduced;
};
