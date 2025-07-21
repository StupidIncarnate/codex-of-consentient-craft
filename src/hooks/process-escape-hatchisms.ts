const THINK_TYPE_PHRASE =
  'Take a step back, breath for a moment, and think through the issue at a high-level';

export function processEscapeHatchisms(content: string): { found: boolean; message: string } {
  const violations: string[] = [];
  // Check for 'any' usage
  if (/:\s*any\b/.test(content)) {
    violations.push(
      `Syntax Violation Found ': any' - Use specific types instead. ${THINK_TYPE_PHRASE}`,
    );
  }
  if (/as\s+any\b/.test(content)) {
    violations.push(
      `Found 'as any' - Type assertions to 'any' bypass type safety. Use proper typing or 'as unknown as SpecificType' if absolutely necessary. ${THINK_TYPE_PHRASE}`,
    );
  }
  if (/<any>/.test(content)) {
    violations.push(
      `Found '<any>' - This TypeScript assertion bypasses type checking. Define proper types instead. ${THINK_TYPE_PHRASE}`,
    );
  }

  // Check for TypeScript escape comments
  if (content.includes('@ts-ignore')) {
    violations.push(
      `Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. ${THINK_TYPE_PHRASE}`,
    );
  }
  if (content.includes('@ts-expect-error')) {
    violations.push(
      `Found '@ts-expect-error' - Don't suppress type errors. Fix the root cause. ${THINK_TYPE_PHRASE}`,
    );
  }
  if (content.includes('@ts-nocheck')) {
    violations.push(
      `Found '@ts-nocheck' - This disables TypeScript checking for the entire file. Remove it and fix type issues. ${THINK_TYPE_PHRASE}`,
    );
  }

  // Check for ESLint disable comments
  if (/eslint-disable(?:-next-line|-line)?/.test(content)) {
    violations.push(
      `Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. ${THINK_TYPE_PHRASE}`,
    );
  }

  if (violations.length > 0) {
    const message = [
      '🛑 Code quality escape hatches detected:',
      ...violations.map((v) => `  ❌ ${v}`),
      '',
      'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
    ].join('\n');

    return { found: true, message };
  }

  return { found: false, message: '' };
}
