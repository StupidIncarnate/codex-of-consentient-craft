import {
  processEscapeHatchisms,
  processEscapeHatchismsInCode,
  hasNewEscapeHatches,
  getNewEscapeHatchMessage,
} from './process-escape-hatchisms';

describe('process-escape-hatchisms', () => {
  // Helper to build expected message format with violations
  const buildExpectedMessage = (violations: string[]) =>
    [
      '🛑 Code quality escape hatches detected:',
      ...violations.map((v) => `  ❌ ${v}`),
      '',
      'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
    ].join('\n');

  describe('processEscapeHatchisms()', () => {
    describe('when content has type escape hatches', () => {
      describe('when using `: any`', () => {
        it('detects type annotation → returns found with specific message', () => {
          const content = 'function test(param: any) { return param; }';

          const result = processEscapeHatchisms(content);

          // Expecting the function to find the escape hatch
          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('multiple any annotations → returns single violation message', () => {
          const content = 'function test(a: any, b: any): any { return a + b; }';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });
      });

      describe('when using `as any`', () => {
        it('detects type assertion → returns found with specific message', () => {
          const content = 'const value = someVar as any;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
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
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
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
              "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
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
              "Found '@ts-expect-error' - Don't suppress type errors. Fix the root cause. Take a step back, breath for a moment, and think through the issue at a high-level",
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
              "Found '@ts-nocheck' - This disables TypeScript checking for the entire file. Remove it and fix type issues. Take a step back, breath for a moment, and think through the issue at a high-level",
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
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('detects eslint-disable-next-line → returns found with specific message', () => {
          const content = '// eslint-disable-next-line\nconst unused = 5;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('detects eslint-disable-line → returns found with specific message', () => {
          const content = 'const unused = 5; // eslint-disable-line';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
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
            "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
          ]),
        });
      });

      describe('multiple instances of same escape hatch pattern', () => {
        it('multiple @ts-ignore comments → returns single violation', () => {
          const content = `// @ts-ignore
const a = invalidCode;
// @ts-ignore
const b = moreInvalidCode;
// @ts-ignore
const c = evenMoreInvalidCode;`;

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('multiple : any annotations → returns single violation', () => {
          const content = `function test(a: any, b: any, c: any): any {
  const d: any = a + b;
  const e: any = c;
  return d + e;
}`;

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('multiple as any assertions → returns single violation', () => {
          const content = `const a = someVar as any;
const b = otherVar as any;
const c = (a + b) as any;
const d = ({ foo: a, bar: b } as any);`;

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('multiple eslint-disable variations → returns single violation', () => {
          const content = `/* eslint-disable */
const unused1 = 5;
// eslint-disable-next-line
const unused2 = 10;
const unused3 = 15; // eslint-disable-line`;

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('multiple <any> generic types → returns single violation', () => {
          const content = `const arr: Array<any> = [];
const promise: Promise<any> = fetch();
const record: Record<string, any> = {};
const map: Map<string, any> = new Map();`;

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('mixed multiple instances of different patterns → returns one per type', () => {
          const content = `// @ts-ignore
// @ts-ignore
function test(a: any, b: any): any {
  const c: any = a + b;
  // eslint-disable-next-line
  // eslint-disable-next-line  
  return (c as any) + (b as any);
}`;

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
              "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
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

      it('any in string literals → detects any keyword', () => {
        const content = `const message = "You can use any value here";
const comment = 'This accepts any type of input';`;

        const result = processEscapeHatchisms(content);

        expect(result).toStrictEqual({
          found: true,
          message: buildExpectedMessage([
            "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          ]),
        });
      });

      it('any in comments → detects any keyword', () => {
        const content = `// This function can handle any type of input
/* You can pass any value to this function */
export function process(value: unknown): string {
  return String(value);
}`;

        const result = processEscapeHatchisms(content);

        expect(result).toStrictEqual({
          found: true,
          message: buildExpectedMessage([
            "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          ]),
        });
      });
    });

    describe('edge cases', () => {
      describe('case sensitivity', () => {
        it('uppercase @TS-IGNORE → returns not found (case sensitive)', () => {
          const content = '// @TS-IGNORE\nconst value = invalidCode;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: false,
            message: '',
          });
        });

        it('mixed case @Ts-Ignore → returns not found (case sensitive)', () => {
          const content = '// @Ts-Ignore\nconst value = invalidCode;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: false,
            message: '',
          });
        });
      });

      describe('whitespace variations', () => {
        it('multiple spaces in : any → detects', () => {
          const content = 'function test(param:     any) { return param; }';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('tab in as any → detects', () => {
          const content = 'const value = someVar as\tany;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('no space after colon :any → detects', () => {
          const content = 'const name:any = "test";';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('array with no spaces [any,any] → detects', () => {
          const content = 'const arr: [any,any] = [1, 2];';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('object type {x:any,y:any} → detects', () => {
          const content = 'type Obj = {x:any,y:any};';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });
      });

      describe('additional any patterns from manual testing', () => {
        it('type alias = any → detects', () => {
          const content = 'type AnyType = any;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('array destructuring with any → detects', () => {
          const content = 'const [x, y]: [any, any] = [1, 2];';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('union type with any → detects', () => {
          const content = 'type Union = string | any;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('intersection type with any → detects', () => {
          const content = 'type Combined = string & any;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('default generic parameter → detects', () => {
          const content = 'interface Container<T = any> { value: T; }';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('extends any in generic constraint → detects', () => {
          const content = 'function test<T extends any>(value: T): T { return value; }';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('keyof any → detects', () => {
          const content = 'type Keys = keyof any;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('readonly any[] → detects', () => {
          const content = 'const arr: readonly any[] = [1, 2, 3];';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('any[] array syntax → detects', () => {
          const content = 'const items: any[] = [];';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('nested any in complex type → detects', () => {
          const content = 'type Complex = { data: { items: any[] } };';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });
      });

      describe('complex type annotations', () => {
        it('generic Array<any> → detects', () => {
          const content = 'const arr: Array<any> = [];';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('Promise<any> → detects', () => {
          const content = 'function getData(): Promise<any> { return fetch("/api"); }';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('function type (x: any) => void → detects', () => {
          const content = 'type Handler = (x: any) => void;';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('Record<string, any> → detects', () => {
          const content = 'const obj: Record<string, any> = {};';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });
      });

      describe('escape hatches in URLs and identifiers', () => {
        it('URL containing /any → detects any keyword', () => {
          const content = 'const url = "https://example.com/any/endpoint";';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('URL containing @ts-ignore → detects (base function checks all content)', () => {
          const content = 'const docUrl = "https://docs.com/@ts-ignore-usage";';

          const result = processEscapeHatchisms(content);

          // Base function detects patterns even in strings
          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('variable name containing any → returns not found', () => {
          const content = `const handleAny = () => {};
const anyValue = 42;
const company = "Any Corp";`;

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: false,
            message: '',
          });
        });

        it('property name any → detects any keyword', () => {
          const content = 'const config = { any: true, some: { any: false } };';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });
      });

      describe('escaped strings', () => {
        it('escaped quotes with : any → detects (base function checks all content)', () => {
          const content = 'const msg = "He said \\"use : any\\" in TypeScript";';

          const result = processEscapeHatchisms(content);

          // Base function detects patterns even in strings
          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('escaped quotes with @ts-ignore → detects (base function checks all content)', () => {
          const content = "const note = 'Don\\'t use @ts-ignore';";

          const result = processEscapeHatchisms(content);

          // Base function detects patterns even in strings
          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });
      });
    });
  });

  describe('processEscapeHatchismsInCode()', () => {
    describe('when escape hatches are in string literals', () => {
      it('ignores @ts-ignore in single quotes', () => {
        const content = `const message = 'This has @ts-ignore in it';`;

        const result = processEscapeHatchismsInCode(content);

        expect(result).toStrictEqual({
          found: false,
          message: '',
        });
      });

      it('ignores @ts-ignore in double quotes', () => {
        const content = `const message = "This has @ts-ignore in it";`;

        const result = processEscapeHatchismsInCode(content);

        expect(result).toStrictEqual({
          found: false,
          message: '',
        });
      });

      it('ignores @ts-ignore in template literals', () => {
        const content = `const message = \`This has @ts-ignore in it\`;`;

        const result = processEscapeHatchismsInCode(content);

        expect(result).toStrictEqual({
          found: false,
          message: '',
        });
      });

      it('ignores : any in string literals', () => {
        const content = `const typeDescription = "Use type: any for this";`;

        const result = processEscapeHatchismsInCode(content);

        expect(result).toStrictEqual({
          found: false,
          message: '',
        });
      });

      it('ignores eslint-disable in strings', () => {
        const content = `const instructions = 'Add eslint-disable-next-line to suppress';`;

        const result = processEscapeHatchismsInCode(content);

        expect(result).toStrictEqual({
          found: false,
          message: '',
        });
      });
    });

    describe('when escape hatches are in actual code', () => {
      it('detects @ts-ignore comment', () => {
        const content = `// @ts-ignore
export function test() {}`;

        const result = processEscapeHatchismsInCode(content);

        expect(result).toStrictEqual({
          found: true,
          message: buildExpectedMessage([
            "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          ]),
        });
      });

      it('detects : any type annotation', () => {
        const content = `function test(param: any) { return param; }`;

        const result = processEscapeHatchismsInCode(content);

        expect(result).toStrictEqual({
          found: true,
          message: buildExpectedMessage([
            "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          ]),
        });
      });

      it('detects eslint-disable comment', () => {
        const content = `/* eslint-disable */
const unused = 5;`;

        const result = processEscapeHatchismsInCode(content);

        expect(result).toStrictEqual({
          found: true,
          message: buildExpectedMessage([
            "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
          ]),
        });
      });
    });

    describe('when content has mixed string literals and code', () => {
      it('detects only code escape hatches, not string ones', () => {
        const content = `
const description = "You can use @ts-ignore to suppress errors";
// @ts-ignore
export function test(param: any) {
  return param;
}`;

        const result = processEscapeHatchismsInCode(content);

        expect(result).toStrictEqual({
          found: true,
          message: buildExpectedMessage([
            "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          ]),
        });
      });
    });
  });

  describe('hasNewEscapeHatches()', () => {
    describe('when old content has no escape hatches', () => {
      describe('when new content has no escape hatches', () => {
        it('returns false', () => {
          const oldContent = 'export function test(param: string) { return param; }';
          const newContent = 'export function test(param: string, other: number) { return param; }';

          const result = hasNewEscapeHatches(oldContent, newContent);

          expect(result).toBe(false);
        });
      });

      describe('when new content adds escape hatches', () => {
        it('returns true', () => {
          const oldContent = 'export function test(param: string) { return param; }';
          const newContent = 'export function test(param: any) { return param; }';

          const result = hasNewEscapeHatches(oldContent, newContent);

          expect(result).toBe(true);
        });
      });
    });

    describe('when old content has escape hatches', () => {
      describe('when new content keeps same escape hatches', () => {
        it('returns false', () => {
          const oldContent = '// @ts-ignore\nexport function test(param: any) { return param; }';
          const newContent =
            '// @ts-ignore\nexport function test(param: any) { return param + 1; }';

          const result = hasNewEscapeHatches(oldContent, newContent);

          expect(result).toBe(false);
        });
      });

      describe('when new content removes escape hatches', () => {
        it('returns false', () => {
          const oldContent = '// @ts-ignore\nexport function test(param: any) { return param; }';
          const newContent = 'export function test(param: string) { return param; }';

          const result = hasNewEscapeHatches(oldContent, newContent);

          expect(result).toBe(false);
        });
      });

      describe('when new content adds different escape hatches', () => {
        it('returns true', () => {
          const oldContent = '// @ts-ignore\nexport function test(param: string) { return param; }';
          const newContent =
            '// @ts-ignore\n// eslint-disable\nexport function test(param: string) { return param; }';

          const result = hasNewEscapeHatches(oldContent, newContent);

          expect(result).toBe(true);
        });
      });
    });

    describe('when escape hatches are in string literals', () => {
      it('old has string literal with @ts-ignore, new adds code @ts-ignore → returns true', () => {
        const oldContent = `const message = "Use @ts-ignore to suppress errors";`;
        const newContent = `const message = "Use @ts-ignore to suppress errors";
// @ts-ignore
export function test() {}`;

        const result = hasNewEscapeHatches(oldContent, newContent);

        expect(result).toBe(true);
      });

      it('old has code @ts-ignore, new has same in string literal → returns false', () => {
        const oldContent = `// @ts-ignore
export function test() {}`;
        const newContent = `const message = "Use @ts-ignore to suppress errors";
export function test() {}`;

        const result = hasNewEscapeHatches(oldContent, newContent);

        expect(result).toBe(false);
      });
    });

    describe('edge cases for hasNewEscapeHatches', () => {
      it('adding different generic any types → returns false if base type exists', () => {
        const oldContent = 'const arr: Array<any> = [];';
        const newContent = 'const arr: Array<any> = [];\nconst promise: Promise<any> = fetch();';

        const result = hasNewEscapeHatches(oldContent, newContent);

        // Both use <any>, so no new TYPE of escape hatch
        expect(result).toBe(false);
      });

      it('complex type with nested any → detects if new', () => {
        const oldContent = 'const simple: string = "hello";';
        const newContent = 'const complex: Record<string, Array<Promise<any>>> = {};';

        const result = hasNewEscapeHatches(oldContent, newContent);

        expect(result).toBe(true);
      });

      it('whitespace changes in escape hatches → returns false', () => {
        const oldContent = 'function test(param: any) {}';
        const newContent = 'function test(param:    any) {}'; // More spaces

        const result = hasNewEscapeHatches(oldContent, newContent);

        expect(result).toBe(false);
      });

      it('case change in identifiers but not escape hatches → returns false', () => {
        const oldContent = 'const handleAny = (x: any) => x;';
        const newContent = 'const HandleAny = (x: any) => x;'; // Capital H

        const result = hasNewEscapeHatches(oldContent, newContent);

        expect(result).toBe(false);
      });

      it('URL in old, escape hatch in new → detects new escape hatch', () => {
        const oldContent = 'const url = "https://example.com/@ts-ignore/docs";';
        const newContent =
          'const url = "https://example.com/@ts-ignore/docs";\n// @ts-ignore\nconst x = 1;';

        const result = hasNewEscapeHatches(oldContent, newContent);

        expect(result).toBe(true);
      });

      it('escaped string patterns → handles correctly', () => {
        const oldContent = `const msg = "Don't use : any";`;
        const newContent = `const msg = "Don't use : any";\nconst value: any = 42;`;

        const result = hasNewEscapeHatches(oldContent, newContent);

        expect(result).toBe(true);
      });
    });
  });

  describe('getNewEscapeHatchMessage()', () => {
    describe('when new escape hatches are introduced', () => {
      it('returns formatted error message', () => {
        const oldContent = 'export function test(param: string) { return param; }';
        const newContent = '// @ts-ignore\nexport function test(param: any) { return param; }';

        const message = getNewEscapeHatchMessage(oldContent, newContent);

        expect(message).toBe(
          buildExpectedMessage([
            "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          ]),
        );
      });
    });

    describe('when no new escape hatches', () => {
      it('returns empty message', () => {
        const oldContent = 'export function test(param: string) { return param; }';
        const newContent = 'export function test(param: string, other: number) { return param; }';

        const message = getNewEscapeHatchMessage(oldContent, newContent);

        expect(message).toBe('');
      });
    });
  });

  describe('File Type Filtering', () => {
    describe('processEscapeHatchisms() with filePath parameter', () => {
      describe('when filePath is a TypeScript file', () => {
        it('detects TypeScript-specific patterns in .ts files', () => {
          const content = 'function test(param: any) { return param; }';

          const result = processEscapeHatchisms(content, 'example.ts');

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('detects @ts-ignore in .tsx files', () => {
          const content = '// @ts-ignore\nconst Component = () => <div>test</div>;';

          const result = processEscapeHatchisms(content, 'Component.tsx');

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('detects eslint-disable in .ts files', () => {
          const content = '/* eslint-disable */\nconst unused = 5;';

          const result = processEscapeHatchisms(content, 'example.ts');

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });
      });

      describe('when filePath is a JavaScript file', () => {
        it('ignores TypeScript-specific patterns but detects eslint-disable in .js files', () => {
          const content =
            'function test(param) {\n  // @ts-ignore\n  /* eslint-disable */\n  return param;\n}';

          const result = processEscapeHatchisms(content, 'example.js');

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('ignores any type in .jsx files', () => {
          const content =
            'const Component = () => {\n  const value = "any value here";\n  return <div>{value}</div>;\n}';

          const result = processEscapeHatchisms(content, 'Component.jsx');

          expect(result).toStrictEqual({
            found: false,
            message: '',
          });
        });
      });

      describe('when filePath is a markdown file', () => {
        it('ignores TypeScript patterns in .md files', () => {
          const content = `# TypeScript Guide
          
Here's how to use \`any\` type:

\`\`\`typescript
function test(param: any) {
  // @ts-ignore
  return param;
}
\`\`\`

You can also use \`eslint-disable\` to suppress linting.`;

          const result = processEscapeHatchisms(content, 'guide.md');

          expect(result).toStrictEqual({
            found: false,
            message: '',
          });
        });

        it('ignores @ts-ignore in markdown code examples', () => {
          const content = 'In your TypeScript code, avoid using `@ts-ignore` comments.';

          const result = processEscapeHatchisms(content, 'README.md');

          expect(result).toStrictEqual({
            found: false,
            message: '',
          });
        });

        it('ignores eslint-disable in markdown documentation', () => {
          const content = 'To fix linting errors, avoid using `eslint-disable-next-line`.';

          const result = processEscapeHatchisms(content, 'docs.md');

          expect(result).toStrictEqual({
            found: false,
            message: '',
          });
        });
      });

      describe('when filePath is a test file', () => {
        it('detects escape hatches in .test.ts files', () => {
          const content =
            'function test(param: any) {\n  // @ts-ignore\n  /* eslint-disable */\n  return param;\n}';

          const result = processEscapeHatchisms(content, 'example.test.ts');

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
              "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('detects escape hatches in .spec.js files', () => {
          const content =
            'function test(param: any) {\n  // @ts-ignore\n  /* eslint-disable */\n  return param;\n}';

          const result = processEscapeHatchisms(content, 'example.spec.js');

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });

        it('detects escape hatches in files ending with test.ts', () => {
          const content =
            'function test(param: any) {\n  // @ts-ignore\n  /* eslint-disable */\n  return param;\n}';

          const result = processEscapeHatchisms(content, 'component.test.ts');

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
              "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });
      });

      describe('when no filePath is provided', () => {
        it('applies all patterns for backward compatibility', () => {
          const content =
            'function test(param: any) {\n  // @ts-ignore\n  /* eslint-disable */\n  return param;\n}';

          const result = processEscapeHatchisms(content);

          expect(result).toStrictEqual({
            found: true,
            message: buildExpectedMessage([
              "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
              "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
              "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
            ]),
          });
        });
      });
    });

    describe('hasNewEscapeHatches() with filePath parameter', () => {
      it('respects file type filtering when checking for new escape hatches', () => {
        const oldContent = '# Documentation\n\nHere is some any content.';
        const newContent = '# Documentation\n\nHere is some any content.\nAnd @ts-ignore examples.';

        const result = hasNewEscapeHatches(oldContent, newContent, 'README.md');

        expect(result).toBe(false); // Should ignore patterns in markdown files
      });

      it('detects new escape hatches in TypeScript files', () => {
        const oldContent = 'function test(param: string) { return param; }';
        const newContent = 'function test(param: any) { return param; }';

        const result = hasNewEscapeHatches(oldContent, newContent, 'example.ts');

        expect(result).toBe(true);
      });

      it('detects new eslint-disable in JavaScript files but ignores TypeScript patterns', () => {
        const oldContent = 'function test(param) {\n  // @ts-ignore\n  return param;\n}';
        const newContent =
          'function test(param) {\n  // @ts-ignore\n  /* eslint-disable */\n  return param;\n}';

        const result = hasNewEscapeHatches(oldContent, newContent, 'example.js');

        expect(result).toBe(true); // eslint-disable is new and applies to JS files
      });

      it('detects new patterns in test files', () => {
        const oldContent = 'function test(param: string) { return param; }';
        const newContent =
          'function test(param: any) {\n  // @ts-ignore\n  /* eslint-disable */\n  return param;\n}';

        const result = hasNewEscapeHatches(oldContent, newContent, 'example.test.ts');

        expect(result).toBe(true); // Test files should have protection
      });
    });

    describe('processEscapeHatchismsInCode() with filePath parameter', () => {
      it('strips strings and applies file type filtering', () => {
        const content =
          'const msg = "Use any type here";\nfunction test(param: any) { return param; }';

        const resultTs = processEscapeHatchismsInCode(content, 'example.ts');
        const resultMd = processEscapeHatchismsInCode(content, 'README.md');

        expect(resultTs.found).toBe(true); // TypeScript file should detect 'any' in code
        expect(resultMd.found).toBe(false); // Markdown file should ignore TypeScript patterns
      });

      it('detects patterns in test files with string stripping', () => {
        const content =
          'const msg = "Use any type here";\nfunction test(param: any) { return param; }';

        const result = processEscapeHatchismsInCode(content, 'example.test.ts');

        expect(result.found).toBe(true); // Test files should have protection
      });
    });
  });
});
