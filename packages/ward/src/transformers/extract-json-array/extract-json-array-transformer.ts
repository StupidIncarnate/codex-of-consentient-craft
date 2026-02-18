/**
 * PURPOSE: Extracts the first complete JSON array from a string that may contain non-JSON text before or after it
 *
 * USAGE:
 * const json = extractJsonArrayTransformer({ output: errorMessageContract.parse('warn text\n[{"key":"val"}]FAIL bar') });
 * // Returns '[{"key":"val"}]'
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

export const extractJsonArrayTransformer = ({ output }: { output: ErrorMessage }): ErrorMessage => {
  const start = output.indexOf('[');
  if (start < 0) {
    return output;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < output.length; i++) {
    const char = output[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '[') {
      depth++;
    } else if (char === ']') {
      depth--;
      if (depth === 0) {
        return output.slice(start, i + 1) as ErrorMessage;
      }
    }
  }

  return output;
};
