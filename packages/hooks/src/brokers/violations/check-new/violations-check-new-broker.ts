/**
 * PURPOSE: Orchestrates violation detection workflow for tool input operations
 *
 * USAGE:
 * const comparison = await violationsCheckNewBroker({ toolInput: editInput, cwd: '/project' });
 * // Returns ViolationComparison indicating if new violations were introduced
 */
import { toolInputGetContentChangesBroker } from '../../tool-input/get-content-changes/tool-input-get-content-changes-broker';
import { hookConfigLoadBroker } from '../../hook-config/load/hook-config-load-broker';
import { eslintLoadConfigBroker } from '../../eslint/load-config/eslint-load-config-broker';
import { eslintConfigFilterTransformer } from '../../../transformers/eslint-config-filter/eslint-config-filter-transformer';
import { violationsAnalyzeBroker } from '../analyze/violations-analyze-broker';
import { eslintLintRunTargetedBroker } from '../../eslint/lint-run-targeted/eslint-lint-run-targeted-broker';
import { eslintIsPathIgnoredBroker } from '../../eslint/is-path-ignored/eslint-is-path-ignored-broker';
import type { ToolInput } from '../../../contracts/tool-input/tool-input-contract';
import {
  violationComparisonContract,
  type ViolationComparison,
} from '../../../contracts/violation-comparison/violation-comparison-contract';
import { getEnv } from '#gateway/node/process';
import { dirname, join } from '#gateway/node/path';
import { preEditReferenceStatics } from '../../../statics/pre-edit-reference/pre-edit-reference-statics';

/**
 * Checks for new ESLint violations introduced by a tool input operation.
 *
 * This broker orchestrates the entire violation detection workflow:
 * 1. Extracts file path from tool input
 * 2. Loads hook configuration
 * 3. Loads and filters ESLint configuration
 * 4. Gets content changes (old vs new)
 * 5. Runs targeted linting on both versions
 * 6. Analyzes and identifies newly introduced violations
 *
 * @param toolInput - The tool input (Write, Edit, or MultiEdit)
 * @param cwd - The checkout the hook acts for (required)
 * @returns Violation comparison indicating if new violations were introduced
 */
export const violationsCheckNewBroker = async ({
  toolInput,
  cwd: workingDir,
}: {
  toolInput: ToolInput;
  cwd: string;
}): Promise<ViolationComparison> => {
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (filePath === '') {
    return violationComparisonContract.parse({
      hasNewViolations: false,
      newViolations: [],
    });
  }

  // Honor the project's ESLint ignore list: a file `npm run ward` would never lint must not be
  // blocked by the hook either. The env seam lets this repo's own hook integration tests lint
  // their `.test-tmp` sandbox, which the repo config globally ignores.
  if (getEnv('DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS') !== 'true') {
    const isIgnored = await eslintIsPathIgnoredBroker({ cwd: workingDir, filePath });
    if (isIgnored) {
      return violationComparisonContract.parse({
        hasNewViolations: false,
        newViolations: [],
      });
    }
  }

  // Load configuration if not provided
  const hookConfig = hookConfigLoadBroker({ cwd: workingDir });

  // Load the host ESLint configuration for the actual file, and for a plain source file beside it:
  // the second is how the filter tells a rule that is off everywhere from one a per-file override
  // switched off for this kind of file (see eslintConfigFilterTransformer).
  const [rawEslintConfig, referenceEslintConfig] = await Promise.all([
    eslintLoadConfigBroker({ cwd: workingDir, filePath }),
    eslintLoadConfigBroker({
      cwd: workingDir,
      filePath: join(dirname(filePath), preEditReferenceStatics.file.name),
    }),
  ]);
  const filteredConfig = eslintConfigFilterTransformer({
    eslintConfig: rawEslintConfig,
    hookConfig,
    referenceEslintConfig,
  });

  // Get content changes using existing utilities
  const contentChanges = await toolInputGetContentChangesBroker({ toolInput });

  if (contentChanges.length === 0) {
    return violationComparisonContract.parse({
      hasNewViolations: false,
      newViolations: [],
    });
  }

  // Process the first content change (typically there's only one)
  const { 0: firstChange } = contentChanges;
  if (!firstChange) {
    return violationComparisonContract.parse({
      hasNewViolations: false,
      message: 'No content changes detected',
      newViolations: [],
    });
  }

  const { oldContent, newContent } = firstChange;

  // Skip if content is identical
  if (String(oldContent) === String(newContent)) {
    return violationComparisonContract.parse({
      hasNewViolations: false,
      newViolations: [],
    });
  }

  // Run targeted lint on both old and new content
  const [oldResults, newResults] = await Promise.all([
    eslintLintRunTargetedBroker({
      content: oldContent,
      filePath,
      config: filteredConfig,
      cwd: workingDir,
    }),
    eslintLintRunTargetedBroker({
      content: newContent,
      filePath,
      config: filteredConfig,
      cwd: workingDir,
    }),
  ]);

  // Analyze violations to find newly introduced ones
  return violationsAnalyzeBroker({
    oldResults,
    newResults,
    config: hookConfig,
    hookData: { tool_input: toolInput },
  });
};
