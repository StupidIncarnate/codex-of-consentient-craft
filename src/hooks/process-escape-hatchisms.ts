const THINK_TYPE_PHRASE =
  'Take a step back, breath for a moment, and think through the issue at a high-level';

interface EscapeHatchPattern {
  selector: RegExp | string;
  error: string;
  type: string;
}

const ESCAPE_HATCH_PATTERNS: EscapeHatchPattern[] = [
  {
    // Catch all uses of 'any' as a complete word (type alias, union, intersection, etc.)
    // This must come first to catch all edge cases
    selector: /\bany\b/,
    error: `Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. ${THINK_TYPE_PHRASE}`,
    type: 'any-keyword',
  },
  {
    selector: '@ts-ignore',
    error: `Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. ${THINK_TYPE_PHRASE}`,
    type: 'ts-ignore',
  },
  {
    selector: '@ts-expect-error',
    error: `Found '@ts-expect-error' - Don't suppress type errors. Fix the root cause. ${THINK_TYPE_PHRASE}`,
    type: 'ts-expect-error',
  },
  {
    selector: '@ts-nocheck',
    error: `Found '@ts-nocheck' - This disables TypeScript checking for the entire file. Remove it and fix type issues. ${THINK_TYPE_PHRASE}`,
    type: 'ts-nocheck',
  },
  {
    selector: /eslint-disable(?:-next-line|-line)?/,
    error: `Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. ${THINK_TYPE_PHRASE}`,
    type: 'eslint-disable',
  },
];

function stripStringLiterals(content: string): string {
  return content
    .replace(/'(?:[^'\\]|\\.)*'/g, "''") // Single quotes with proper escaping
    .replace(/"(?:[^"\\]|\\.)*"/g, '""') // Double quotes with proper escaping
    .replace(/`(?:[^`\\]|\\.)*`/g, '``'); // Template literals
}

function checkContent(
  content: string,
  stripStrings = false,
): { violations: string[]; types: Set<string> } {
  const violations: string[] = [];
  const types = new Set<string>();
  const contentToCheck = stripStrings ? stripStringLiterals(content) : content;

  for (const pattern of ESCAPE_HATCH_PATTERNS) {
    const matches =
      typeof pattern.selector === 'string'
        ? contentToCheck.includes(pattern.selector)
        : pattern.selector.test(contentToCheck);

    if (matches) {
      types.add(pattern.type);
      if (!violations.includes(pattern.error)) {
        violations.push(pattern.error);
      }
    }
  }

  return { violations, types };
}

function buildErrorMessage(violations: string[]): string {
  return [
    '🛑 Code quality escape hatches detected:',
    ...violations.map((v) => `  ❌ ${v}`),
    '',
    'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
  ].join('\n');
}

export function processEscapeHatchisms(content: string): { found: boolean; message: string } {
  const { violations } = checkContent(content);
  return violations.length > 0
    ? { found: true, message: buildErrorMessage(violations) }
    : { found: false, message: '' };
}

export function processEscapeHatchismsInCode(content: string): { found: boolean; message: string } {
  const { violations } = checkContent(content, true);
  return violations.length > 0
    ? { found: true, message: buildErrorMessage(violations) }
    : { found: false, message: '' };
}

export function hasNewEscapeHatches(oldContent: string, newContent: string): boolean {
  const { types: oldTypes } = checkContent(oldContent, true);
  const { types: newTypes } = checkContent(newContent, true);

  // Check if there are any escape hatch types in new that weren't in old
  for (const type of Array.from(newTypes)) {
    if (!oldTypes.has(type)) {
      return true;
    }
  }

  return false;
}

export function getNewEscapeHatchMessage(_oldContent: string, newContent: string): string {
  return processEscapeHatchismsInCode(newContent).message;
}
