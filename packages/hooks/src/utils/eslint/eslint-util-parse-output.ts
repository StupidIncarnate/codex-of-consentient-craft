import type { EslintResult } from '../../types/eslint-type';
import { eslintUtilIsEslintResult } from './eslint-util-is-eslint-result';
import debug from 'debug';
const log = debug('questmaestro:eslint-utils');

export const eslintUtilParseOutput = ({ output }: { output: string }) => {
  try {
    // TODO: ARCHITECTURAL CONCERN - Bracket counting algorithm has limitations:
    // 1. Doesn't properly parse JSON string boundaries - treats brackets inside
    //    string values as array brackets (e.g. {"message": "Error [line 5]"})
    // 2. Works by luck because JSON.parse() validates candidates and fails gracefully
    // 3. Could be inefficient with deeply nested or malformed JSON
    // 4. More robust solution would be a proper JSON tokenizer/parser
    // Current implementation works well for ESLint output but consider refactoring
    // if used for general JSON parsing or performance becomes an issue.

    // Find potential JSON array starting positions
    let startIndex = 0;

    while (true) {
      const arrayStart = output.indexOf('[', startIndex);
      if (arrayStart === -1) break;

      // Try to find the matching closing bracket
      let bracketCount = 0;
      let endIndex = arrayStart;

      for (let i = arrayStart; i < output.length; i++) {
        if (output[i] === '[') bracketCount++;
        else if (output[i] === ']') {
          bracketCount--;
          if (bracketCount === 0) {
            endIndex = i;
            break;
          }
        }
      }

      if (bracketCount === 0) {
        // Found a complete array, try to parse it
        const candidate = output.substring(arrayStart, endIndex + 1);
        try {
          const parsed = JSON.parse(candidate) as unknown;
          if (Array.isArray(parsed)) {
            // Filter to keep only valid EslintResult items
            const validResults = parsed.filter((item: unknown) => eslintUtilIsEslintResult(item));

            // If we found any valid results, return them
            if (validResults.length > 0) {
              return validResults;
            }
          }
        } catch {
          // Continue searching if this candidate fails to parse
        }
      }

      startIndex = arrayStart + 1;
    }

    return [] as EslintResult[];
  } catch (e) {
    log('Failed to parse Lint output:', e);
    return [] as EslintResult[];
  }
};
