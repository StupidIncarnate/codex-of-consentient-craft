import { FileUtil } from '../utils/file/file-util';
import { LintRunner } from './lint-runner';
import { ViolationAnalyzerUtil } from '../utils/violation-analyzer/violation-analyzer-util';
import { HookConfigUtil } from '../utils/hook-config/hook-config-util';
import { EslintUtil } from '../utils/eslint/eslint-util';
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
    const hookConfig = HookConfigUtil.loadConfig({ cwd });

    // Load and filter the host ESLint configuration for the actual file
    const eslintConfig = await EslintUtil.loadConfigByFile({ cwd, filePath });
    const filteredConfig = EslintUtil.createFilteredConfig({
      eslintConfig,
      hookConfig,
    });

    // Get content changes using existing utilities
    const contentChanges = await FileUtil.getContentChanges({ toolInput });

    if (contentChanges.length === 0) {
      return {
        hasNewViolations: false,
        newViolations: [],
      };
    }

    // Process the first content change (typically there's only one)
    const firstChange = contentChanges[0];
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
    return ViolationAnalyzerUtil.hasNewViolations({
      oldResults,
      newResults,
      config: hookConfig,
      hookData: { tool_input: toolInput },
    });
  },
};
