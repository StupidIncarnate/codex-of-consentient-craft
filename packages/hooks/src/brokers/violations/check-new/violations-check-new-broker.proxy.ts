import { toolInputGetContentChangesBrokerProxy } from '../../tool-input/get-content-changes/tool-input-get-content-changes-broker.proxy';
import { hookConfigLoadBrokerProxy } from '../../hook-config/load/hook-config-load-broker.proxy';
import { eslintLoadConfigBrokerProxy } from '../../eslint/load-config/eslint-load-config-broker.proxy';
import { eslintLintRunTargetedBrokerProxy } from '../../eslint/lint-run-targeted/eslint-lint-run-targeted-broker.proxy';
import { eslintIsPathIgnoredBrokerProxy } from '../../eslint/is-path-ignored/eslint-is-path-ignored-broker.proxy';
import { processHookLintIgnoredPathsAdapterProxy } from '../../../adapters/process/hook-lint-ignored-paths/process-hook-lint-ignored-paths-adapter.proxy';
import { violationsAnalyzeBrokerProxy } from '../analyze/violations-analyze-broker.proxy';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

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

  // The content this proxy configures as the "old" side of a comparison — setupLintResults
  // below addresses old vs new lint runs by this literal, since the new content is whatever
  // edit the caller's test applies and isn't known here.
  const oldContent = 'const x = old;';

  return {
    // The filePath isn't known yet when this is called (the test constructs its toolInput
    // afterward), so match any file — this proxy's tests exercise the "ignored path"
    // short-circuit itself, not which specific file was ignored.
    setPathIgnored: ({ ignored }: { ignored: boolean }): void => {
      isPathIgnoredProxy.setIgnored({
        filePath: (value: unknown) => typeof value === 'string',
        ignored,
      });
    },
    setupViolationCheck: ({ hasViolations = false }: { hasViolations?: boolean } = {}): void => {
      // Setup content changes with actual content to avoid early returns in lint broker
      // For Edit tool: content contains 'old' which gets replaced with 'new' by the edit
      // This ensures old and new content are different. The filePath is never asserted on:
      // callers reach this staging only when they intend the lint step to actually run.
      contentChangesProxy.setupReadFileSuccess({
        filePath: FilePathStub({ value: '/test/file.ts' }),
        content: oldContent,
      });

      if (hasViolations) {
        // Configure lint to return violations in new content but not old content
        lintProxy.setupLintResults({
          oldContent,
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
          oldContent,
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
