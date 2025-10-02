import { toolInputGetContentChangesBroker } from '../brokers/tool-input/get-content-changes/tool-input-get-content-changes-broker';
import { hookConfigLoadBroker } from '../brokers/hook-config/load/hook-config-load-broker';
import { eslintLoadConfigBroker } from '../brokers/eslint/load-config/eslint-load-config-broker';
import { eslintConfigFilterTransformer } from '../transformers/eslint-config-filter/eslint-config-filter-transformer';
import { violationsAnalyzeBroker } from '../brokers/violations/analyze/violations-analyze-broker';
import { LintRunner } from './lint-runner';
import type { ToolInput } from '../types/tool-type';
import type { ViolationComparison } from '../types/lint-type';

export const PreEditLint = {
  checkForNewViolations: async ({
    toolInput,
    cwd = process.cwd(),
  }: {
    toolInput: ToolInput;
    cwd?: string;
  }): Promise<ViolationComparison> => {
    const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

    if (!filePath) {
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
      LintRunner.runTargetedLint({
        content: oldContent,
        filePath,
        config: filteredConfig,
        cwd,
      }),
      LintRunner.runTargetedLint({
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
  },
};
