import type { EslintMessage } from '../../types/eslint-type';
import { lintContent } from './lint-content';
import { debugDebug } from '../../adapters/debug/debug-debug';

const log = debugDebug({ namespace: 'questmaestro:eslint-utils' });

const ERROR_SEVERITY = 2;
const MAX_ERRORS_TO_DISPLAY = 10;
const EXIT_CODE_ERROR = 2;
const EXIT_CODE_SUCCESS = 0;

export const lintContentWithFiltering = async ({
  filePath,
  content,
}: {
  filePath: string;
  content: string;
}): Promise<void> => {
  log('Processing file with TypeScript rule filtering:', filePath);

  // First, get the fixed content and results
  const { fixResults } = await lintContent({ filePath, content });

  // Check if there are any remaining errors after fixing
  const [firstResult] = fixResults;
  if (firstResult?.messages !== undefined) {
    let errors = firstResult.messages.filter(
      (message: EslintMessage) => message.severity === ERROR_SEVERITY,
    );

    // Filter out @typescript-eslint errors in pre-hook mode
    errors = errors.filter((error: EslintMessage) => {
      const ruleId = error.ruleId ?? '';
      return !ruleId.startsWith('@typescript-eslint/');
    });

    if (errors.length > 0) {
      const errorSummary = `[PreToolUse Hook] ESLint found ${errors.length} error(s) in ${filePath}:\n`;
      const errorDetails = errors
        .slice(0, MAX_ERRORS_TO_DISPLAY)
        .map((error: EslintMessage) => {
          const ruleInfo = error.ruleId === undefined ? '' : ` [${error.ruleId}]`;
          return `  Line ${error.line}: ${error.message}${ruleInfo}`;
        })
        .join('\n');

      process.stderr.write(`${errorSummary + errorDetails}\n`);
      process.exit(EXIT_CODE_ERROR);
    }
  }

  process.exit(EXIT_CODE_SUCCESS);
};
