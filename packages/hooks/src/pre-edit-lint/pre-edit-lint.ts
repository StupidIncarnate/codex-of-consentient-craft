import { FileUtils } from '../utils/file-utils';
import { LintRunner } from './lint-runner';
import { ViolationAnalyzer } from './violation-analyzer';
import type { ToolInput } from '../types';
import type { ViolationComparison } from './types';

export const PreEditLint = {
  checkForNewViolations: async ({
    toolInput,
  }: {
    toolInput: ToolInput;
  }): Promise<ViolationComparison> => {
    const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

    if (!filePath) {
      return {
        hasNewViolations: false,
        newViolations: [],
      };
    }

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
      }),
      LintRunner.runTargetedLint({
        content: newContent,
        filePath,
      }),
    ]);

    // Analyze violations to find newly introduced ones
    return ViolationAnalyzer.hasNewViolations({
      oldResults,
      newResults,
    });
  },
};
