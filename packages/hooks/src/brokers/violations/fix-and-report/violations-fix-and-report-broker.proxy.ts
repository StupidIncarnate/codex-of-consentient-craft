/**
 * PURPOSE: Proxy for violations-fix-and-report-broker that delegates to child broker proxies
 *
 * USAGE:
 * const proxy = violationsFixAndReportBrokerProxy();
 * proxy.setupFixAndReport({ hasViolations: true });
 */
import { eslintLoadConfigBrokerProxy } from '../../eslint/load-config/eslint-load-config-broker.proxy';
import { eslintLintRunWithFixBrokerProxy } from '../../eslint/lint-run-with-fix/eslint-lint-run-with-fix-broker.proxy';

export const violationsFixAndReportBrokerProxy = (): {
  setupFixAndReport: (params?: { hasViolations?: boolean }) => void;
} => {
  eslintLoadConfigBrokerProxy();
  const lintWithFixProxy = eslintLintRunWithFixBrokerProxy();

  return {
    setupFixAndReport: ({ hasViolations = false }: { hasViolations?: boolean } = {}): void => {
      if (hasViolations) {
        // Configure lint to return error-level violations after auto-fix
        lintWithFixProxy.returnsLintResults({
          results: [
            {
              filePath: '/test/file.ts',
              messages: [
                {
                  ruleId: 'no-console',
                  severity: 2,
                  message: 'Unexpected console statement',
                  line: 1,
                  column: 1,
                },
              ],
              errorCount: 1,
              warningCount: 0,
            },
          ],
        });
      } else {
        // No violations remaining after auto-fix
        lintWithFixProxy.returnsLintResults({
          results: [
            {
              filePath: '/test/file.ts',
              messages: [],
              errorCount: 0,
              warningCount: 0,
            },
          ],
        });
      }
    },
  };
};
