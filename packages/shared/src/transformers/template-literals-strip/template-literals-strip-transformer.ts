/**
 * PURPOSE: Strips template-literal contents (including nested ${...} expressions and nested
 * templates) and line comments while preserving single/double-quoted string literals so
 * regex-based import scanners ignore import-shaped code samples in template-literal markdown
 * but still see the real import paths inside `from '...'` strings.
 *
 * USAGE:
 * const stripped = templateLiteralsStripTransformer({
 *   source: contentTextContract.parse([
 *     'const md = `import { fake } from "./fake";`;',
 *     "import { real } from './real';",
 *   ].join('\n')),
 * });
 * // Returns ContentText: template body replaced with spaces, real top-level import preserved
 *
 * WHEN-TO-USE: Pre-pass for import-extraction regex on TypeScript source that may contain
 *   markdown-generating template literals
 * WHEN-NOT-TO-USE: When AST-level analysis is needed — use a TypeScript parser. Top-level
 *   string literals containing `from 'path'` shapes (e.g., a string-encoded code sample
 *   assigned to a normal variable) are still preserved and would phantom-match; only template
 *   literals are scrubbed.
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const TWO_CHAR_STEP = 2;
const BRACE_MARKER: ContentText = contentTextContract.parse('');

type StripContext =
  | { kind: 'template' }
  | { kind: 'interp'; openBraces: ContentText[]; stringQuote: null | "'" | '"' };

export const templateLiteralsStripTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText => {
  const text = String(source);
  const len = text.length;
  const stack: StripContext[] = [];
  let out = '';
  let i = 0;

  while (i < len) {
    const c = text[i] ?? '';
    const next = i + 1 < len ? (text[i + 1] ?? '') : '';
    const top = stack.length === 0 ? null : stack[stack.length - 1];

    if (top === undefined || top === null) {
      if (c === '`') {
        stack.push({ kind: 'template' });
        out += ' ';
        i += 1;
      } else if (c === '/' && next === '/') {
        while (i < len && text[i] !== '\n') {
          out += ' ';
          i += 1;
        }
      } else if (c === "'" || c === '"') {
        const quote = c;
        out += quote;
        i += 1;
        while (i < len && text[i] !== quote) {
          if (text[i] === '\\' && i + 1 < len) {
            out += text[i] ?? '';
            out += text[i + 1] ?? '';
            i += TWO_CHAR_STEP;
          } else {
            out += text[i] ?? '';
            i += 1;
          }
        }
        if (i < len) {
          out += text[i] ?? '';
          i += 1;
        }
      } else {
        out += c;
        i += 1;
      }
    } else if (top.kind === 'template') {
      if (c === '`') {
        stack.pop();
        out += ' ';
        i += 1;
      } else if (c === '\\' && i + 1 < len) {
        out += ' ';
        out += text[i + 1] === '\n' ? '\n' : ' ';
        i += TWO_CHAR_STEP;
      } else if (c === '$' && next === '{') {
        stack.push({ kind: 'interp', openBraces: [BRACE_MARKER], stringQuote: null });
        out += '  ';
        i += TWO_CHAR_STEP;
      } else if (c === '\n') {
        out += '\n';
        i += 1;
      } else {
        out += ' ';
        i += 1;
      }
    } else if (top.stringQuote !== null) {
      if (c === '\\' && i + 1 < len) {
        out += ' ';
        out += text[i + 1] === '\n' ? '\n' : ' ';
        i += TWO_CHAR_STEP;
      } else if (c === top.stringQuote) {
        top.stringQuote = null;
        out += ' ';
        i += 1;
      } else if (c === '\n') {
        out += '\n';
        i += 1;
      } else {
        out += ' ';
        i += 1;
      }
    } else if (c === '{') {
      top.openBraces.push(BRACE_MARKER);
      out += ' ';
      i += 1;
    } else if (c === '}') {
      top.openBraces.pop();
      if (top.openBraces.length === 0) {
        stack.pop();
      }
      out += ' ';
      i += 1;
    } else if (c === '`') {
      stack.push({ kind: 'template' });
      out += ' ';
      i += 1;
    } else if (c === "'" || c === '"') {
      top.stringQuote = c;
      out += ' ';
      i += 1;
    } else if (c === '\n') {
      out += '\n';
      i += 1;
    } else {
      out += ' ';
      i += 1;
    }
  }

  return contentTextContract.parse(out);
};
