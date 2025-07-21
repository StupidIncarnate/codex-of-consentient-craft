import { processEscapeHatchisms } from './process-escape-hatchisms';

describe('process-escape-hatchisms', () => {
  describe('processEscapeHatchisms()', () => {
    describe('when content has type escape hatches', () => {
      describe('when using : any', () => {
        it('detects type annotation → returns found with specific message', () => {
          const content = 'function test(param: any) { return param; }';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: expect.stringContaining("Syntax Violation Found ': any'"),
          });
          expect(result.message).toContain('Use specific types instead');
          expect(result.message).toContain('Take a step back');
        });

        it('multiple any annotations → returns all violations', () => {
          const content = 'function test(a: any, b: any): any { return a + b; }';

          const result = processEscapeHatchisms(content);

          expect(result.found).toBe(true);
          expect(result.message).toContain("Syntax Violation Found ': any'");
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
            message: expect.stringContaining("Found 'as any'"),
          });
          expect(result.message).toContain("Type assertions to 'any' bypass type safety");
        });
      });

      describe('when using <any>', () => {
        it('detects angle bracket assertion → returns found with specific message', () => {
          const content = 'const value = <any>someVar;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: expect.stringContaining("Found '<any>'"),
          });
          expect(result.message).toContain('This TypeScript assertion bypasses type checking');
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
            message: expect.stringContaining("Found '@ts-ignore'"),
          });
          expect(result.message).toContain('This suppresses TypeScript errors');
        });
      });

      describe('when using @ts-expect-error', () => {
        it('detects comment → returns found with specific message', () => {
          const content = '// @ts-expect-error\nconst value = invalidCode;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: expect.stringContaining("Found '@ts-expect-error'"),
          });
          expect(result.message).toContain("Don't suppress type errors");
        });
      });

      describe('when using @ts-nocheck', () => {
        it('detects comment → returns found with specific message', () => {
          const content = '// @ts-nocheck\nconst value = anything;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: expect.stringContaining("Found '@ts-nocheck'"),
          });
          expect(result.message).toContain('This disables TypeScript checking for the entire file');
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
            message: expect.stringContaining("Found 'eslint-disable'"),
          });
          expect(result.message).toContain("Don't suppress linting");
        });

        it('detects eslint-disable-next-line → returns found with specific message', () => {
          const content = '// eslint-disable-next-line\nconst unused = 5;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: expect.stringContaining("Found 'eslint-disable'"),
          });
        });

        it('detects eslint-disable-line → returns found with specific message', () => {
          const content = 'const unused = 5; // eslint-disable-line';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: expect.stringContaining("Found 'eslint-disable'"),
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

        expect(result.found).toBe(true);
        expect(result.message).toContain('🛑 Code quality escape hatches detected:');
        expect(result.message).toContain("Found '@ts-ignore'");
        expect(result.message).toContain("Syntax Violation Found ': any'");
        expect(result.message).toContain("Found 'as any'");
        expect(result.message).toContain("Found 'eslint-disable'");
        expect(result.message).toContain('These patterns bypass important safety checks');
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
