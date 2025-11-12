/**
 * PURPOSE: Orchestrates ESLint auto-fix workflow and reports remaining error-level violations
 *
 * USAGE:
 * const result = await violationsFixAndReportBroker({ toolInput: editInput, cwd: '/project' });
 * // Returns { violations: LintResult[], message: string } with errors after auto-fix
 */
import { eslintLoadConfigBroker } from '../../eslint/load-config/eslint-load-config-broker';
import { eslintLintRunWithFixBroker } from '../../eslint/lint-run-with-fix/eslint-lint-run-with-fix-broker';
import { violationsCountByRuleTransformer } from '../../../transformers/violations-count-by-rule/violations-count-by-rule-transformer';
import { violationMessageFormatTransformer } from '../../../transformers/violation-message-format/violation-message-format-transformer';
import type { ToolInput } from '../../../contracts/tool-input/tool-input-contract';
import {
  hookPostEditResponderResultContract,
  type HookPostEditResponderResult,
} from '../../../contracts/hook-post-edit-responder-result/hook-post-edit-responder-result-contract';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';

/**
 * Runs ESLint with auto-fix and reports remaining error-level violations.
 *
 * This broker orchestrates the post-edit fix workflow:
 * 1. Extracts file path from tool input
 * 2. Loads full ESLint configuration (no filtering)
 * 3. Runs ESLint with fix option (writes fixes to disk automatically)
 * 4. Filters results to errors only (quiet mode)
 * 5. Formats and returns remaining violations
 *
 * @param toolInput - The tool input (Write, Edit, or MultiEdit)
 * @param cwd - The current working directory (defaults to process.cwd())
 * @returns Result with error-level violations and formatted message
 */
export const violationsFixAndReportBroker = async ({
  toolInput,
  cwd,
}: {
  toolInput: ToolInput;
  cwd?: FilePath;
}): Promise<HookPostEditResponderResult> => {
  const workingDir = cwd ?? filePathContract.parse(process.cwd());
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (filePath === '') {
    return hookPostEditResponderResultContract.parse({
      violations: [],
      message: 'No file path found in tool input',
    });
  }

  // Load full ESLint config (no filtering - all rules)
  const eslintConfig = await eslintLoadConfigBroker({ cwd: workingDir, filePath });

  // Run ESLint with fix option (ESLint handles file I/O and writes fixes)
  // Returns only error-level violations (quiet mode)
  const violations = await eslintLintRunWithFixBroker({
    filePath,
    config: eslintConfig,
    cwd: workingDir,
  });

  // Format message with remaining violations
  const violationCounts = violationsCountByRuleTransformer({ results: violations });
  const message =
    violationCounts.length > 0
      ? violationMessageFormatTransformer({ violations: violationCounts })
      : 'All violations auto-fixed successfully';

  return hookPostEditResponderResultContract.parse({
    violations,
    message,
  });
};
