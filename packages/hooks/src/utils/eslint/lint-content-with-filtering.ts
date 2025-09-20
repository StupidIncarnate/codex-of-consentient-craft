import type { EslintMessage } from '../../types/eslint-type';
import { lintContent } from './lint-content';
import debug from 'debug';

const log = debug('questmaestro:eslint-utils');

export const lintContentWithFiltering = async ({
  filePath,
  content,
}: {
  filePath: string;
  content: string;
}) => {
  log('Processing file with TypeScript rule filtering:', filePath);

  // First, get the fixed content and results
  const { fixResults } = await lintContent({ filePath, content });

  // Check if there are any remaining errors after fixing
  if (fixResults.length > 0 && fixResults[0].messages) {
    let errors = fixResults[0].messages.filter((msg: EslintMessage) => msg.severity === 2);

    // Filter out @typescript-eslint errors in pre-hook mode
    errors = errors.filter((error: EslintMessage) => {
      const ruleId = error.ruleId || '';
      return !ruleId.startsWith('@typescript-eslint/');
    });

    if (errors.length > 0) {
      const errorSummary = `[PreToolUse Hook] ESLint found ${errors.length} error(s) in ${filePath}:\n`;
      const errorDetails = errors
        .slice(0, 10)
        .map((error: EslintMessage) => {
          const ruleInfo = error.ruleId ? ` [${error.ruleId}]` : '';
          return `  Line ${error.line}: ${error.message}${ruleInfo}`;
        })
        .join('\n');

      console.error(errorSummary + errorDetails);
      process.exit(2);
    }
  }

  process.exit(0);
};
