/**
 * PURPOSE: Reduces the text that follows an object literal's opening `{` to that object's OWN
 * top-level text — nested `{}`/`[]`/`()` content and comments are dropped, string literals are kept
 * whole — so `staticsStringPropertyTransformer` can look for a `key: 'value'` pair without a nested
 * object's key answering for the outer one. It tracks quotes so a brace inside a string cannot move
 * the depth count, and stops at the brace that closes the object.
 *
 * USAGE:
 * topLevelTextLayerTransformer({ body: "cmd: 'git', nested: { cmd: 'npm' } };" });
 * // Returns "cmd: 'git', nested: , " with the nested content removed
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

const OPENERS = '{[(';
const CLOSERS = '}])';
const QUOTES = `'"\``;
const LINE_COMMENT = '//';
const BLOCK_COMMENT_OPEN = '/*';
const BLOCK_COMMENT_CLOSE = '*/';

export const topLevelTextLayerTransformer = ({ body }: { body: ContentText }): ContentText => {
  let depth = 1;
  let quote = '';
  let text = '';

  for (let index = 0; index < body.length && depth > 0; index += 1) {
    const char = body.charAt(index);
    const pair = body.slice(index, index + LINE_COMMENT.length);

    if (quote !== '') {
      const keep = depth === 1;
      if (char === '\\') {
        text += keep ? pair : '';
        index += 1;
        continue;
      }
      if (char === quote) {
        quote = '';
      }
      text += keep ? char : '';
      continue;
    }

    if (pair === LINE_COMMENT) {
      const lineEnd = body.indexOf('\n', index);
      index = lineEnd === -1 ? body.length : lineEnd;
      continue;
    }
    if (pair === BLOCK_COMMENT_OPEN) {
      const commentEnd = body.indexOf(BLOCK_COMMENT_CLOSE, index + BLOCK_COMMENT_OPEN.length);
      index = commentEnd === -1 ? body.length : commentEnd + 1;
      continue;
    }

    if (QUOTES.includes(char)) {
      quote = char;
    } else if (OPENERS.includes(char)) {
      depth += 1;
    } else if (CLOSERS.includes(char)) {
      depth -= 1;
      continue;
    }

    text += depth === 1 ? char : '';
  }

  return contentTextContract.parse(text);
};
