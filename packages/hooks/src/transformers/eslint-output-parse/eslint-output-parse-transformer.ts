import type { EslintResult } from '../../types/eslint-type';
import { isEslintResult } from '../../contracts/is-eslint-result/is-eslint-result';
import { debugDebug } from '../../adapters/debug/debug-debug';
const log = debugDebug({ namespace: 'questmaestro:eslint-utils' });

/**
 * Finds the closing bracket index for an array starting at arrayStart
 * Returns the index of the closing bracket, or -1 if no matching bracket found
 */
const findMatchingBracket = ({
  output,
  arrayStart,
}: {
  output: string;
  arrayStart: number;
}): number => {
  let bracketCount = 0;

  for (let index = arrayStart; index < output.length; index += 1) {
    const char = output[index];
    if (char === '[') {
      bracketCount += 1;
    } else if (char === ']') {
      bracketCount -= 1;
      if (bracketCount === 0) {
        return index;
      }
    }
  }

  return -1;
};

/**
 * Attempts to parse a JSON array candidate and extract valid EslintResult items
 * Returns the valid results, or null if parsing fails or no valid results found
 */
const tryParseCandidate = ({ candidate }: { candidate: string }): EslintResult[] | null => {
  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }

    const validResults = parsed.filter((item: unknown): item is EslintResult =>
      isEslintResult(item),
    );

    return validResults.length > 0 ? validResults : null;
  } catch {
    return null;
  }
};

/**
 * Parses ESLint output to extract lint results
 *
 * ARCHITECTURAL NOTE: Uses bracket counting to find JSON arrays in output.
 * This approach has limitations (doesn't handle brackets in strings properly)
 * but works reliably for ESLint output format. Consider using a proper JSON
 * tokenizer if adapting for other use cases.
 */
export const eslintOutputParseTransformer = ({ output }: { output: string }): EslintResult[] => {
  try {
    let startIndex = 0;

    while (startIndex < output.length) {
      const arrayStart = output.indexOf('[', startIndex);
      if (arrayStart === -1) {
        break;
      }

      const endIndex = findMatchingBracket({ output, arrayStart });

      if (endIndex !== -1) {
        const candidate = output.substring(arrayStart, endIndex + 1);
        const results = tryParseCandidate({ candidate });

        if (results !== null) {
          return results;
        }
      }

      startIndex = arrayStart + 1;
    }

    return [];
  } catch (error: unknown) {
    log('Failed to parse Lint output:', error);
    return [];
  }
};
