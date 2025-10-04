import { toolInputGetContentChangesBroker } from '../../tool-input/get-content-changes/tool-input-get-content-changes-broker';
import { hookConfigLoadBroker } from '../../hook-config/load/hook-config-load-broker';
import { eslintLoadConfigBroker } from '../../eslint/load-config/eslint-load-config-broker';
import { eslintConfigFilterTransformer } from '../../../transformers/eslint-config-filter/eslint-config-filter-transformer';
import { violationsAnalyzeBroker } from '../analyze/violations-analyze-broker';
import { eslintLintRunTargetedBroker } from '../../eslint/lint-run-targeted/eslint-lint-run-targeted-broker';
import type { ToolInput } from '../../../contracts/tool-input/tool-input-contract';
import type { ViolationComparison } from '../../../contracts/violation-comparison/violation-comparison-contract';

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
 * @param cwd - The current working directory (defaults to process.cwd())
 * @returns Violation comparison indicating if new violations were introduced
 */
export const violationsCheckNewBroker = async ({
  toolInput,
  cwd = process.cwd(),
}: {
  toolInput: ToolInput;
  cwd?: string;
}): Promise<ViolationComparison> => {
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (filePath === '') {
    return {
      hasNewViolations: false,
      newViolations: [],
    };
  }

  // Load configuration if not provided
  const hookConfig = hookConfigLoadBroker({ cwd });

  // Load and filter the host ESLint configuration for the actual file
  const eslintConfig = await eslintLoadConfigBroker({ cwd, filePath });
  const filteredConfig = eslintConfigFilterTransformer({
    eslintConfig,
    hookConfig,
  });

  // Get content changes using existing utilities
  const contentChanges = await toolInputGetContentChangesBroker({ toolInput });

  if (contentChanges.length === 0) {
    return {
      hasNewViolations: false,
      newViolations: [],
    };
  }

  // Process the first content change (typically there's only one)
  const { 0: firstChange } = contentChanges;
  if (!firstChange) {
    return {
      hasNewViolations: false,
      message: 'No content changes detected',
      newViolations: [],
    };
  }

  const { oldContent, newContent } = firstChange;

  // Skip if content is identical
  if (oldContent === newContent) {
    return {
      hasNewViolations: false,
      newViolations: [],
    };
  }

  // Run targeted lint on both old and new content
  const [oldResults, newResults] = await Promise.all([
    eslintLintRunTargetedBroker({
      content: oldContent,
      filePath,
      config: filteredConfig,
      cwd,
    }),
    eslintLintRunTargetedBroker({
      content: newContent,
      filePath,
      config: filteredConfig,
      cwd,
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
