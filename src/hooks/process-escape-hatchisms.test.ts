import { processEscapeHatchisms } from './process-escape-hatchisms';

describe('process-escape-hatchisms', () => {
  // Helper to build expected message format
  const buildExpectedMessage = (violations: string[]) => {
    return [
      '🛑 Code quality escape hatches detected:',
      ...violations.map(v => `  ❌ ${v}`),
      '',
      'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.'
    ].join('\n');
  };
  describe('processEscapeHatchisms()', () => {
    describe('when content has type escape hatches', () => {
      describe('when using : any', () => {
        it('detects type annotation → returns found with specific message', () => {
          const content = 'function test(param: any) { return param; }';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Syntax Violation Found ': any' - Use specific types instead. Take a step back, breath for a moment, and think through the issue at a high-level"
            ]),
          });
        });

        it('multiple any annotations → returns all violations', () => {
          const content = 'function test(a: any, b: any): any { return a + b; }';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: expect.stringContaining("Syntax Violation Found ': any'"),
          });
          // Should only have one violation message for : any pattern
          const anyCount = (result.message.match(/Syntax Violation Found ': any'/g) || []).length;
          expect(anyCount).toBe(1);
        });
      });

      describe('when using as any', () => {
        it('detects type assertion → returns found with specific message', () => {
          const content = 'const value = someVar as any;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'as any' - Type assertions to 'any' bypass type safety. Use proper typing or 'as unknown as SpecificType' if absolutely necessary. Take a step back, breath for a moment, and think through the issue at a high-level"
            ]),
          });
        });
      });

      describe('when using <any>', () => {
        it('detects angle bracket assertion → returns found with specific message', () => {
          const content = 'const value = <any>someVar;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found '<any>' - This TypeScript assertion bypasses type checking. Define proper types instead. Take a step back, breath for a moment, and think through the issue at a high-level"
            ]),
          });
        });
      });
    });

    describe('when content has TypeScript suppression comments', () => {
      describe('when using @ts-ignore', () => {
        it('detects comment → returns found with specific message', () => {
          const content = '// @ts-ignore\nconst value = invalidCode;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level"
            ]),
          });
        });
      });

      describe('when using @ts-expect-error', () => {
        it('detects comment → returns found with specific message', () => {
          const content = '// @ts-expect-error\nconst value = invalidCode;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found '@ts-expect-error' - Don't suppress type errors. Fix the root cause. Take a step back, breath for a moment, and think through the issue at a high-level"
            ]),
          });
        });
      });

      describe('when using @ts-nocheck', () => {
        it('detects comment → returns found with specific message', () => {
          const content = '// @ts-nocheck\nconst value = anything;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found '@ts-nocheck' - This disables TypeScript checking for the entire file. Remove it and fix type issues. Take a step back, breath for a moment, and think through the issue at a high-level"
            ]),
          });
        });
      });
    });

    describe('when content has ESLint suppression comments', () => {
      describe('when using eslint-disable', () => {
        it('detects eslint-disable → returns found with specific message', () => {
          const content = '/* eslint-disable */\nconst unused = 5;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level"
            ]),
          });
        });

        it('detects eslint-disable-next-line → returns found with specific message', () => {
          const content = '// eslint-disable-next-line\nconst unused = 5;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level"
            ]),
          });
        });

        it('detects eslint-disable-line → returns found with specific message', () => {
          const content = 'const unused = 5; // eslint-disable-line';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level"
            ]),
          });
        });
      });
    });

    describe('when content has multiple violations', () => {
      it('multiple escape hatches → returns all violations in message', () => {
        const content = `// @ts-ignore
function test(param: any): any {
  // eslint-disable-next-line
  return param as any;
}`;

        const result = processEscapeHatchisms(content);

        expect(result).toStrictEqual({
          found: true,
          message: buildExpectedMessage([
            "Syntax Violation Found ': any' - Use specific types instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            "Found 'as any' - Type assertions to 'any' bypass type safety. Use proper typing or 'as unknown as SpecificType' if absolutely necessary. Take a step back, breath for a moment, and think through the issue at a high-level",
            "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level"
          ]),
        });
      });
    });

    describe('when content is clean', () => {
      it('no escape hatches → returns not found with empty message', () => {
        const content = `export function add(a: number, b: number): number {
  return a + b;
}

export interface User {
  name: string;
  age: number;
}`;

        const result = processEscapeHatchisms(content);

        expect(result).toStrictEqual({
          found: false,
          message: '',
        });
      });

      it('any in string literals → returns not found', () => {
        const content = `const message = "You can use any value here";
const comment = 'This accepts any type of input';`;

        const result = processEscapeHatchisms(content);

        expect(result).toStrictEqual({
          found: false,
          message: '',
        });
      });

      it('any in comments → returns not found', () => {
        const content = `// This function can handle any type of input
/* You can pass any value to this function */
export function process(value: unknown): string {
  return String(value);
}`;

        const result = processEscapeHatchisms(content);

        expect(result).toStrictEqual({
          found: false,
          message: '',
        });
      });
    });
  });
});
