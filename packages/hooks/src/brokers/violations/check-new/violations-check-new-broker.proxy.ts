import { toolInputGetContentChangesBrokerProxy } from '../../tool-input/get-content-changes/tool-input-get-content-changes-broker.proxy';
import { hookConfigLoadBrokerProxy } from '../../hook-config/load/hook-config-load-broker.proxy';
import { eslintLoadConfigBrokerProxy } from '../../eslint/load-config/eslint-load-config-broker.proxy';
import { eslintLintRunTargetedBrokerProxy } from '../../eslint/lint-run-targeted/eslint-lint-run-targeted-broker.proxy';
import { eslintIsPathIgnoredBrokerProxy } from '../../eslint/is-path-ignored/eslint-is-path-ignored-broker.proxy';
import { processHookLintIgnoredPathsAdapterProxy } from '../../../adapters/process/hook-lint-ignored-paths/process-hook-lint-ignored-paths-adapter.proxy';
import { violationsAnalyzeBrokerProxy } from '../analyze/violations-analyze-broker.proxy';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

export const violationsCheckNewBrokerProxy = (): {
  setupViolationCheck: (params?: { hasViolations?: boolean }) => void;
  setPathIgnored: (params: { ignored: boolean }) => void;
} => {
  processCwdAdapterProxy();
  const contentChangesProxy = toolInputGetContentChangesBrokerProxy();
  hookConfigLoadBrokerProxy();
  eslintLoadConfigBrokerProxy();
  const lintProxy = eslintLintRunTargetedBrokerProxy();
  const isPathIgnoredProxy = eslintIsPathIgnoredBrokerProxy();
  processHookLintIgnoredPathsAdapterProxy();
  violationsAnalyzeBrokerProxy();

  return {
    setPathIgnored: ({ ignored }: { ignored: boolean }): void => {
      isPathIgnoredProxy.setIgnored({ ignored });
    },
    setupViolationCheck: ({ hasViolations = false }: { hasViolations?: boolean } = {}): void => {
      // Setup content changes with actual content to avoid early returns in lint broker
      // For Edit tool: content contains 'old' which gets replaced with 'new' by the edit
      // This ensures old and new content are different
      contentChangesProxy.setupReadFileSuccess({ content: 'const x = old;' });

      if (hasViolations) {
        // Configure lint to return violations in new content but not old content
        lintProxy.setupLintResults({
          oldResults: [
            {
              filePath: '/test/file.ts',
              messages: [],
              errorCount: 0,
              warningCount: 0,
            },
          ],
          newResults: [
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
        // No violations in either old or new content
        lintProxy.setupLintResults({
          oldResults: [
            {
              filePath: '/test/file.ts',
              messages: [],
              errorCount: 0,
              warningCount: 0,
            },
          ],
          newResults: [
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
