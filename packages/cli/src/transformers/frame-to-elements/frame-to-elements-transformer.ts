/**
 * PURPOSE: Transforms a terminal frame string into an array of ScreenElement objects
 *
 * USAGE:
 * frameToElementsTransformer({ frame: '> Option 1\n  Option 2\nSome text' });
 * // Returns [
 * //   { type: 'menuItem', content: 'Option 1', selected: true },
 * //   { type: 'menuItem', content: 'Option 2', selected: false },
 * //   { type: 'text', content: 'Some text' }
 * // ]
 */

import {
  screenElementContract,
  type ScreenElement,
} from '../../contracts/screen-element/screen-element-contract';

export const frameToElementsTransformer = ({ frame }: { frame: string }): ScreenElement[] => {
  const lines = frame.split('\n');

  return lines
    .filter((line) => line.trim() !== '')
    .map((line) => {
      // Check for selected menu item (starts with > or special cursor character)
      if (/^[>\u276f]\s*/u.test(line)) {
        const content = line.replace(/^[>\u276f]\s*/u, '');
        return screenElementContract.parse({
          type: 'menuItem',
          content,
          selected: true,
        });
      }

      // Check for unselected menu item (starts with spaces, indicating indentation like a list)
      if (/^\s{2,}\S/u.test(line)) {
        const content = line.trim();
        return screenElementContract.parse({
          type: 'menuItem',
          content,
          selected: false,
        });
      }

      // Check for input field patterns (contains prompt-like patterns)
      if (/[?:]\s*$/u.test(line) || /^\s*[?]/u.test(line)) {
        return screenElementContract.parse({
          type: 'input',
          content: line.trim(),
        });
      }

      // Default to text
      return screenElementContract.parse({
        type: 'text',
        content: line.trim(),
      });
    });
};
