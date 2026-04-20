/**
 * PURPOSE: Extracts Jest's summary JSON from a string that may also contain non-JSON text
 * and unrelated JSON fragments (ward run-result dumps, MSW mock response bodies, network
 * logs, etc.). Identifies Jest's output by its signature top-level keys rather than
 * position or size so nothing else in the stream can tip the selection.
 *
 * USAGE:
 * const json = extractJsonObjectTransformer({ output: errorMessageContract.parse('PASS foo\n{"id":"1"}\n{"numTotalTestSuites":5,"testResults":[]}') });
 * // Returns '{"numTotalTestSuites":5,"testResults":[]}'
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

const JEST_SUMMARY_KEY = '"numTotalTestSuites"';

export const extractJsonObjectTransformer = ({
  output,
}: {
  output: ErrorMessage;
}): ErrorMessage => {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let currentStart = -1;

  for (let i = 0; i < output.length; i++) {
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

    if (char === '{') {
      if (depth === 0) {
        currentStart = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && currentStart >= 0) {
        const candidate = output.slice(currentStart, i + 1);
        if (candidate.includes(JEST_SUMMARY_KEY)) {
          return candidate as ErrorMessage;
        }
        currentStart = -1;
      }
    }
  }

  return output;
};
