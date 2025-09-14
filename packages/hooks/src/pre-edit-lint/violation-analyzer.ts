import type { LintResult, ViolationCount, ViolationComparison } from './types';

export const ViolationAnalyzer = {
  countViolationsByRule: ({ results }: { results: LintResult[] }): ViolationCount[] => {
    const counts = new Map<string, number>();

    for (const result of results) {
      for (const message of result.messages) {
        if (message.severity === 2 && message.ruleId) {
          // Only count errors (severity 2), not warnings
          const current = counts.get(message.ruleId) || 0;
          counts.set(message.ruleId, current + 1);
        }
      }
    }

    return Array.from(counts.entries()).map(([ruleId, count]) => ({
      ruleId,
      count,
    }));
  },

  findNewViolations: ({
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
        newlyIntroduced.push({
          ruleId: newViolation.ruleId,
          count: newViolation.count - oldCount,
        });
      }
    }

    return newlyIntroduced;
  },

  formatViolationMessage: ({ violations }: { violations: ViolationCount[] }): string => {
    const lines = ['🛑 New code quality violations detected:'];

    for (const violation of violations) {
      const count = violation.count === 1 ? '1 violation' : `${violation.count} violations`;
      lines.push(`  ❌ ${violation.ruleId}: ${count}`);
    }

    lines.push('');
    lines.push('These rules help maintain code quality and safety. Please fix the violations.');

    return lines.join('\n');
  },

  hasNewViolations: ({
    oldResults,
    newResults,
  }: {
    oldResults: LintResult[];
    newResults: LintResult[];
  }): ViolationComparison => {
    const oldViolations = ViolationAnalyzer.countViolationsByRule({ results: oldResults });
    const newViolations = ViolationAnalyzer.countViolationsByRule({ results: newResults });

    const newlyIntroduced = ViolationAnalyzer.findNewViolations({
      oldViolations,
      newViolations,
    });

    const hasNewViolations = newlyIntroduced.length > 0;

    return {
      hasNewViolations,
      newViolations: newlyIntroduced,
      message: hasNewViolations
        ? ViolationAnalyzer.formatViolationMessage({ violations: newlyIntroduced })
        : undefined,
    };
  },
};
