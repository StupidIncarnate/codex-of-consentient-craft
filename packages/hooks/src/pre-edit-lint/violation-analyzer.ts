import type { LintResult, ViolationCount, ViolationComparison, ViolationDetail } from './types';
import { MessageFormatter } from './message-formatter';

export const ViolationAnalyzer = {
  countViolationsByRule: ({ results }: { results: LintResult[] }): ViolationCount[] => {
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
  },

  formatViolationMessage: ({ violations }: { violations: ViolationCount[] }): string => {
    const lines = ['🛑 New code quality violations detected:'];

    for (const violation of violations) {
      const count = violation.count === 1 ? '1 violation' : `${violation.count} violations`;
      lines.push(`  ❌ Code Quality Issue: ${count}`);

      // Show line:column info for each violation
      for (const detail of violation.details) {
        lines.push(`     Line ${detail.line}:${detail.column} - ${detail.message}`);
      }
    }

    lines.push('');
    lines.push('These rules help maintain code quality and safety. Please fix the violations.');

    return lines.join('\n');
  },

  hasNewViolations: ({
    oldResults,
    newResults,
    config,
    hookData,
  }: {
    oldResults: LintResult[];
    newResults: LintResult[];
    config?: import('./types').PreEditLintConfig;
    hookData?: unknown;
  }): ViolationComparison => {
    const oldViolations = ViolationAnalyzer.countViolationsByRule({ results: oldResults });
    const newViolations = ViolationAnalyzer.countViolationsByRule({ results: newResults });

    const newlyIntroduced = ViolationAnalyzer.findNewViolations({
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
        message = ViolationAnalyzer.formatViolationMessage({ violations: newlyIntroduced });
      }
    }

    return {
      hasNewViolations,
      newViolations: newlyIntroduced,
      message,
    };
  },
};
