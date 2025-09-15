import { FileUtils } from '../utils/file-utils';
import { LintRunner } from './lint-runner';
import { ViolationAnalyzer } from './violation-analyzer';
import { ConfigLoader } from './config-loader';
import { ConfigValidator } from './config-validator';
import { ESLintIntegration } from './eslint-integration';
import type { ToolInput } from '../types';
import type { ViolationComparison, PreEditLintConfig } from './types';

export const PreEditLint = {
  checkForNewViolations: async ({
    toolInput,
    config,
    cwd = process.cwd(),
  }: {
    toolInput: ToolInput;
    config?: PreEditLintConfig;
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
    const lintConfig = config || ConfigLoader.loadConfig({ cwd });

    // Validate configuration
    await ConfigValidator.validateConfig({ config: lintConfig, cwd });

    // Load and filter the host ESLint configuration for the actual file
    const hostConfig = await ESLintIntegration.loadHostConfig({ cwd, filePath });
    const filteredConfig = ESLintIntegration.createFilteredConfig({
      hostConfig,
      allowedRules: lintConfig.rules,
    });

    // Get content changes using existing utilities
    const contentChanges = await FileUtils.getContentChanges({ toolInput });

    if (contentChanges.length === 0) {
      return {
        hasNewViolations: false,
        newViolations: [],
      };
    }

    // Process the first content change (typically there's only one)
    const { oldContent, newContent } = contentChanges[0];

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
    return ViolationAnalyzer.hasNewViolations({
      oldResults,
      newResults,
      config: lintConfig,
      hookData: { tool_input: toolInput },
    });
  },
};
