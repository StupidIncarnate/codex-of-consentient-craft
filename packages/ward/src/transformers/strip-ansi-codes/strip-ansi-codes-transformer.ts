/**
 * PURPOSE: Removes ANSI escape sequences from a string by scanning for ESC[ sequences character by character
 *
 * USAGE:
 * stripAnsiCodesTransformer({ text: errorMessageContract.parse('\x1b[31mError\x1b[0m') });
 * // Returns 'Error' as ErrorMessage
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

const ESC_CHAR_CODE = 27;
const ESC_SEQUENCE_PREFIX_LENGTH = 2;

export const stripAnsiCodesTransformer = ({ text }: { text: ErrorMessage }): ErrorMessage => {
  let result = '';
  let i = 0;

  while (i < text.length) {
    if (text.charCodeAt(i) === ESC_CHAR_CODE && text[i + 1] === '[') {
      i += ESC_SEQUENCE_PREFIX_LENGTH;
      while (i < text.length && text[i] !== 'm') {
        i++;
      }
      i++;
    } else {
      result += text[i];
      i++;
    }
  }

  return result as ErrorMessage;
};
