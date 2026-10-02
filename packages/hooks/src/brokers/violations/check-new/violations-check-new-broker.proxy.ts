import { toolInputGetContentChangesBrokerProxy } from '../../tool-input/get-content-changes/tool-input-get-content-changes-broker.proxy';
import { hookConfigLoadBrokerProxy } from '../../hook-config/load/hook-config-load-broker.proxy';
import { eslintLoadConfigBrokerProxy } from '../../eslint/load-config/eslint-load-config-broker.proxy';
import { eslintLintRunTargetedBrokerProxy } from '../../eslint/lint-run-targeted/eslint-lint-run-targeted-broker.proxy';
import { eslintIsPathIgnoredBrokerProxy } from '../../eslint/is-path-ignored/eslint-is-path-ignored-broker.proxy';
import { violationsAnalyzeBrokerProxy } from '../analyze/violations-analyze-broker.proxy';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { dirname, join } from '#gateway/node/path';

export const violationsCheckNewBrokerProxy = (): {
  setupViolationCheck: (params?: { hasViolations?: boolean; filePath?: string }) => void;
  setupFileMissing: (params: { filePath: string }) => void;
  setPathIgnored: (params: { ignored: boolean }) => void;
  setLintIgnoredPaths: (params: { enabled: boolean }) => void;
} => {
  const envProxy = getEnvProxy();
  const lintIgnoredPathsName = 'DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS';
  // Every setup method stages the current value: a later staging wins, so one method restaging
  // undefined would undo an earlier setLintIgnoredPaths({ enabled: true }).
  const state: { lintIgnoredPaths: string | undefined } = { lintIgnoredPaths: undefined };
  const stageLintIgnoredPaths = (): void => {
    envProxy.setupEnv({ name: lintIgnoredPathsName, value: state.lintIgnoredPaths });
  };

  const contentChangesProxy = toolInputGetContentChangesBrokerProxy();
  hookConfigLoadBrokerProxy();
  const loadConfigProxy = eslintLoadConfigBrokerProxy();
  const lintProxy = eslintLintRunTargetedBrokerProxy();
  const isPathIgnoredProxy = eslintIsPathIgnoredBrokerProxy();
  violationsAnalyzeBrokerProxy();

  // Every test in this proxy's family edits '/test/file.ts'; the config ESLint calculates for it
  // is what the broker filters down to the hook's rules.
  loadConfigProxy.returnsConfig({
    filePath: '/test/file.ts',
    config: { rules: { 'no-console': 'warn' } },
  });
  // The plain source file the broker asks about beside it, to tell a deliberate per-file
  // exemption from a rule that is off everywhere.
  loadConfigProxy.returnsConfig({
    filePath: '/test/dungeonmaster-pre-edit-reference.ts',
    config: { rules: { 'no-console': 'warn' } },
  });

  // The content this proxy configures as the "old" side of a comparison — setupLintResults
  // below addresses old vs new lint runs by this literal, since the new content is whatever
  // edit the caller's test applies and isn't known here.
  const oldContent = 'const x = old;';

  return {
    setLintIgnoredPaths: ({ enabled }: { enabled: boolean }): void => {
      state.lintIgnoredPaths = enabled ? 'true' : undefined;
      stageLintIgnoredPaths();
    },
    // The filePath isn't known yet when this is called (the test constructs its toolInput
    // afterward), so match any file — this proxy's tests exercise the "ignored path"
    // short-circuit itself, not which specific file was ignored.
    setPathIgnored: ({ ignored }: { ignored: boolean }): void => {
      isPathIgnoredProxy.setIgnored({
        filePath: (value: unknown) => typeof value === 'string',
        ignored,
      });
    },
    setupFileMissing: ({ filePath }: { filePath: string }): void => {
      stageLintIgnoredPaths();
      contentChangesProxy.setupReadFileNotFound({ filePath });
    },
    setupViolationCheck: ({
      hasViolations = false,
      filePath = '/test/file.ts',
    }: { hasViolations?: boolean; filePath?: string } = {}): void => {
      stageLintIgnoredPaths();
      // The config ESLint calculates for the edited file and for the plain file beside it.
      loadConfigProxy.returnsConfig({ filePath, config: { rules: { 'no-console': 'warn' } } });
      loadConfigProxy.returnsConfig({
        filePath: join(dirname(filePath), 'dungeonmaster-pre-edit-reference.ts'),
        config: { rules: { 'no-console': 'warn' } },
      });
      // Setup content changes with actual content to avoid early returns in lint broker
      // For Edit tool: content contains 'old' which gets replaced with 'new' by the edit
      // This ensures old and new content are different. The filePath is the file the caller's
      // toolInput edits, since the broker reads that exact path for the old content.
      contentChangesProxy.setupReadFileSuccess({
        filePath,
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
