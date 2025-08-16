const THINK_TYPE_PHRASE =
  'Take a step back, breath for a moment, and think through the issue at a high-level';

interface EscapeHatchPattern {
  selector: RegExp | string;
  error: string;
  type: string;
  fileTypes?: string[]; // File extensions this pattern applies to (e.g., ['.ts', '.tsx'])
  isCommentBased?: boolean; // If true, this pattern should be checked in comments
}

const ESCAPE_HATCH_PATTERNS: EscapeHatchPattern[] = [
  {
    // Catch all uses of 'any' as a complete word (type alias, union, intersection, etc.)
    // This must come first to catch all edge cases
    selector: /\bany\b/,
    error: `Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. ${THINK_TYPE_PHRASE}`,
    type: 'any-keyword',
    fileTypes: ['.ts', '.tsx'], // Only check TypeScript files
    isCommentBased: false, // Check in code, not comments
  },
  {
    selector: '@ts-ignore',
    error: `Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. ${THINK_TYPE_PHRASE}`,
    type: 'ts-ignore',
    fileTypes: ['.ts', '.tsx'], // Only check TypeScript files
    isCommentBased: true, // This is a comment directive
  },
  {
    selector: '@ts-expect-error',
    error: `Found '@ts-expect-error' - Don't suppress type errors. Fix the root cause. ${THINK_TYPE_PHRASE}`,
    type: 'ts-expect-error',
    fileTypes: ['.ts', '.tsx'], // Only check TypeScript files
    isCommentBased: true, // This is a comment directive
  },
  {
    selector: '@ts-nocheck',
    error: `Found '@ts-nocheck' - This disables TypeScript checking for the entire file. Remove it and fix type issues. ${THINK_TYPE_PHRASE}`,
    type: 'ts-nocheck',
    fileTypes: ['.ts', '.tsx'], // Only check TypeScript files
    isCommentBased: true, // This is a comment directive
  },
  {
    selector: /eslint-disable(?:-next-line|-line)?/,
    error: `Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. ${THINK_TYPE_PHRASE}`,
    type: 'eslint-disable',
    fileTypes: ['.ts', '.tsx', '.js', '.jsx'], // Check JS/TS files but not markdown
    isCommentBased: true, // This is a comment directive
  },
];

function stripStringLiterals(content: string): string {
  // Only remove string literals, preserve comments for comment-based pattern detection
  return content
    .replace(/'(?:[^'\\]|\\.)*'/g, "''") // Single quotes with proper escaping
    .replace(/"(?:[^"\\]|\\.)*"/g, '""') // Double quotes with proper escaping
    .replace(/`(?:[^`\\]|\\.)*`/g, '``'); // Template literals
}

function stripCommentsAndStringLiterals(content: string): string {
  // Remove both comments and string literals for code-only pattern detection
  return (
    content
      // Remove single-line comments
      .replace(/\/\/.*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove string literals
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/`(?:[^`\\]|\\.)*`/g, '``')
  );
}

function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.[^.]*$/);
  return match ? match[0] : '';
}

function filterPatternsForFile(
  patterns: EscapeHatchPattern[],
  filePath?: string,
): EscapeHatchPattern[] {
  if (!filePath) {
    // No file path provided, apply all patterns (backward compatibility)
    return patterns;
  }

  const fileExtension = getFileExtension(filePath);
  return patterns.filter((pattern) => {
    // If pattern has no fileTypes restriction, apply to all files
    if (!pattern.fileTypes || pattern.fileTypes.length === 0) {
      return true;
    }
    // Otherwise, only apply if file extension matches
    return pattern.fileTypes.includes(fileExtension);
  });
}

function checkContent(
  content: string,
  stripStrings = false,
  filePath?: string,
): { violations: string[]; types: Set<string> } {
  const violations: string[] = [];
  const types = new Set<string>();

  // Filter patterns based on file type
  const applicablePatterns = filterPatternsForFile(ESCAPE_HATCH_PATTERNS, filePath);

  for (const pattern of applicablePatterns) {
    // Determine which content to check based on pattern type and stripStrings flag
    let contentToCheck: string;
    if (stripStrings) {
      // When stripStrings is true, we want to ignore patterns in string literals
      // For code-based patterns (like 'any'), also strip comments
      // For comment-based patterns (like '@ts-ignore'), preserve comments
      if (pattern.isCommentBased) {
        contentToCheck = stripStringLiterals(content);
      } else {
        contentToCheck = stripCommentsAndStringLiterals(content);
      }
    } else {
      // When stripStrings is false, check the raw content
      contentToCheck = content;
    }

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

export function processEscapeHatchisms(
  content: string,
  filePath?: string,
): { found: boolean; message: string } {
  const { violations } = checkContent(content, false, filePath);
  return violations.length > 0
    ? { found: true, message: buildErrorMessage(violations) }
    : { found: false, message: '' };
}

export function processEscapeHatchismsInCode(
  content: string,
  filePath?: string,
): { found: boolean; message: string } {
  const { violations } = checkContent(content, true, filePath);
  return violations.length > 0
    ? { found: true, message: buildErrorMessage(violations) }
    : { found: false, message: '' };
}

export function hasNewEscapeHatches(
  oldContent: string,
  newContent: string,
  filePath?: string,
): boolean {
  const { types: oldTypes } = checkContent(oldContent, true, filePath);
  const { types: newTypes } = checkContent(newContent, true, filePath);

  // Check if there are any escape hatch types in new that weren't in old
  for (const type of Array.from(newTypes)) {
    if (!oldTypes.has(type)) {
      return true;
    }
  }

  return false;
}

export function getNewEscapeHatchMessage(
  _oldContent: string,
  newContent: string,
  filePath?: string,
): string {
  return processEscapeHatchismsInCode(newContent, filePath).message;
}
