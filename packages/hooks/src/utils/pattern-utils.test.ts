import { PatternUtils } from './pattern-utils';

describe('PatternUtils', () => {
  describe('filterPatternsForFile()', () => {
    const mockPatterns = [
      {
        selector: /\bany\b/,
        error: 'Any type error',
        type: 'any-keyword',
        fileTypes: ['.ts', '.tsx'],
        isCommentBased: false,
      },
      {
        selector: '@ts-ignore',
        error: 'TS ignore error',
        type: 'ts-ignore',
        fileTypes: ['.ts', '.tsx'],
        isCommentBased: true,
      },
      {
        selector: /eslint-disable/,
        error: 'ESLint disable error',
        type: 'eslint-disable',
        fileTypes: ['.ts', '.tsx', '.js', '.jsx'],
        isCommentBased: true,
      },
      {
        selector: 'no-restrictions',
        error: 'No restrictions error',
        type: 'no-restrictions',
        isCommentBased: false,
      },
    ];

    // VALID cases
    it("VALID: {patterns: allPatterns, filePath: 'test.ts'} => returns TypeScript patterns", () => {
      const result = PatternUtils.filterPatternsForFile({
        patterns: mockPatterns,
        filePath: 'test.ts',
      });
      expect(result).toStrictEqual([
        mockPatterns[0], // any-keyword
        mockPatterns[1], // ts-ignore
        mockPatterns[2], // eslint-disable
        mockPatterns[3], // no-restrictions
      ]);
    });

    it("VALID: {patterns: allPatterns, filePath: 'test.js'} => returns JavaScript patterns", () => {
      const result = PatternUtils.filterPatternsForFile({
        patterns: mockPatterns,
        filePath: 'test.js',
      });
      expect(result).toStrictEqual([
        mockPatterns[2], // eslint-disable
        mockPatterns[3], // no-restrictions
      ]);
    });

    it("VALID: {patterns: allPatterns, filePath: 'test.md'} => returns no file type restricted patterns", () => {
      const result = PatternUtils.filterPatternsForFile({
        patterns: mockPatterns,
        filePath: 'test.md',
      });
      expect(result).toStrictEqual([mockPatterns[3]]); // no-restrictions only
    });

    it('VALID: {patterns: allPatterns, filePath: undefined} => returns all patterns', () => {
      const result = PatternUtils.filterPatternsForFile({
        patterns: mockPatterns,
      });
      expect(result).toStrictEqual(mockPatterns);
    });

    it('VALID: {patterns: patternsWithoutFileTypes} => returns all patterns', () => {
      const patternsWithoutFileTypes = [
        {
          selector: 'pattern1',
          error: 'Error 1',
          type: 'type1',
          isCommentBased: false,
        },
        {
          selector: 'pattern2',
          error: 'Error 2',
          type: 'type2',
          fileTypes: [],
          isCommentBased: false,
        },
      ];
      const result = PatternUtils.filterPatternsForFile({
        patterns: patternsWithoutFileTypes,
        filePath: 'any.file',
      });
      expect(result).toStrictEqual(patternsWithoutFileTypes);
    });

    // EDGE cases
    it("EDGE: {patterns: [], filePath: 'test.ts'} => returns empty array", () => {
      const result = PatternUtils.filterPatternsForFile({
        patterns: [],
        filePath: 'test.ts',
      });
      expect(result).toStrictEqual([]);
    });

    it("EDGE: {patterns: allPatterns, filePath: 'noext'} => returns patterns with no file type restrictions", () => {
      const result = PatternUtils.filterPatternsForFile({
        patterns: mockPatterns,
        filePath: 'noext',
      });
      expect(result).toStrictEqual([mockPatterns[3]]); // no-restrictions only
    });

    it("EDGE: {patterns: allPatterns, filePath: 'test.tsx'} => returns TypeScript patterns", () => {
      const result = PatternUtils.filterPatternsForFile({
        patterns: mockPatterns,
        filePath: 'test.tsx',
      });
      expect(result).toStrictEqual([
        mockPatterns[0], // any-keyword
        mockPatterns[1], // ts-ignore
        mockPatterns[2], // eslint-disable
        mockPatterns[3], // no-restrictions
      ]);
    });

    // EMPTY cases
    it("EMPTY: {patterns: allPatterns, filePath: ''} => returns all patterns", () => {
      const result = PatternUtils.filterPatternsForFile({
        patterns: mockPatterns,
        filePath: '',
      });
      expect(result).toStrictEqual(mockPatterns); // empty string treated same as undefined
    });
  });

  describe('checkContent()', () => {
    // VALID cases
    it("VALID: {content: 'let x: any = 5;', stripStrings: false} => returns any-keyword violation", () => {
      const result = PatternUtils.checkContent({
        content: 'let x: any = 5;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("VALID: {content: '// @ts-ignore\\ncode', stripStrings: false} => returns ts-ignore violation", () => {
      const result = PatternUtils.checkContent({
        content: '// @ts-ignore\ncode',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['ts-ignore']));
    });

    it("VALID: {content: 'clean code', stripStrings: false} => returns no violations", () => {
      const result = PatternUtils.checkContent({
        content: 'clean code',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([]);
      expect(result.types).toStrictEqual(new Set());
    });

    it("VALID: {content: 'let x: any = 5;', stripStrings: true, filePath: 'test.ts'} => returns any-keyword violation", () => {
      const result = PatternUtils.checkContent({
        content: 'let x: any = 5;',
        stripStrings: true,
        filePath: 'test.ts',
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it('VALID: {content: \'const str = "any";\', stripStrings: true} => returns no violations', () => {
      const result = PatternUtils.checkContent({
        content: 'const str = "any";',
        stripStrings: true,
      });
      expect(result.violations).toStrictEqual([]);
      expect(result.types).toStrictEqual(new Set());
    });

    it("VALID: {content: '// any comment', stripStrings: true} => returns no violations", () => {
      const result = PatternUtils.checkContent({
        content: '// any comment',
        stripStrings: true,
      });
      expect(result.violations).toStrictEqual([]);
      expect(result.types).toStrictEqual(new Set());
    });

    it("VALID: {content: '// @ts-ignore\\ncode', stripStrings: true} => returns ts-ignore violation", () => {
      const result = PatternUtils.checkContent({
        content: '// @ts-ignore\ncode',
        stripStrings: true,
      });
      expect(result.violations).toStrictEqual([
        "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['ts-ignore']));
    });

    // Multiple violations
    it("VALID: {content: 'any; @ts-ignore', stripStrings: false} => returns multiple violations", () => {
      const result = PatternUtils.checkContent({
        content: 'any; // @ts-ignore',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
        "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword', 'ts-ignore']));
    });

    // File path filtering
    it("VALID: {content: 'any', filePath: 'test.md', stripStrings: false} => returns no violations", () => {
      const result = PatternUtils.checkContent({
        content: 'any',
        filePath: 'test.md',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([]);
      expect(result.types).toStrictEqual(new Set());
    });

    it("VALID: {content: 'eslint-disable', filePath: 'test.ts', stripStrings: false} => returns eslint-disable violation", () => {
      const result = PatternUtils.checkContent({
        content: '// eslint-disable',
        filePath: 'test.ts',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['eslint-disable']));
    });

    // EDGE cases
    it("EDGE: {content: 'let x: any;', stripStrings: false} => returns violations without duplicates", () => {
      const result = PatternUtils.checkContent({
        content: 'let x: any;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'any any any', stripStrings: false} => returns single violation for multiple matches", () => {
      const result = PatternUtils.checkContent({
        content: 'any any any',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    // EMPTY cases
    it("EMPTY: {content: '', stripStrings: false} => returns no violations", () => {
      const result = PatternUtils.checkContent({
        content: '',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([]);
      expect(result.types).toStrictEqual(new Set());
    });

    it("EMPTY: {content: '', stripStrings: true} => returns no violations", () => {
      const result = PatternUtils.checkContent({
        content: '',
        stripStrings: true,
      });
      expect(result.violations).toStrictEqual([]);
      expect(result.types).toStrictEqual(new Set());
    });

    // EDGE: Specific 'any' pattern variations discovered during testing
    it("EDGE: {content: 'const value = someVar as any;'} => detects type assertion", () => {
      const result = PatternUtils.checkContent({
        content: 'const value = someVar as any;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'const value = <any>someVar;'} => detects angle bracket assertion", () => {
      const result = PatternUtils.checkContent({
        content: 'const value = <any>someVar;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'type AnyType = any;'} => detects type alias", () => {
      const result = PatternUtils.checkContent({
        content: 'type AnyType = any;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'const [x, y]: [any, any] = [1, 2];'} => detects array destructuring", () => {
      const result = PatternUtils.checkContent({
        content: 'const [x, y]: [any, any] = [1, 2];',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'type Union = string | any;'} => detects union type", () => {
      const result = PatternUtils.checkContent({
        content: 'type Union = string | any;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'type Combined = string & any;'} => detects intersection type", () => {
      const result = PatternUtils.checkContent({
        content: 'type Combined = string & any;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'interface Container<T = any> { value: T; }'} => detects default generic", () => {
      const result = PatternUtils.checkContent({
        content: 'interface Container<T = any> { value: T; }',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'function test<T extends any>(value: T): T'} => detects generic constraint", () => {
      const result = PatternUtils.checkContent({
        content: 'function test<T extends any>(value: T): T { return value; }',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'type Keys = keyof any;'} => detects keyof any", () => {
      const result = PatternUtils.checkContent({
        content: 'type Keys = keyof any;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'const arr: readonly any[] = [1, 2, 3];'} => detects readonly any array", () => {
      const result = PatternUtils.checkContent({
        content: 'const arr: readonly any[] = [1, 2, 3];',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'const items: any[] = [];'} => detects any array syntax", () => {
      const result = PatternUtils.checkContent({
        content: 'const items: any[] = [];',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'const arr: Array<any> = [];'} => detects generic Array", () => {
      const result = PatternUtils.checkContent({
        content: 'const arr: Array<any> = [];',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'function getData(): Promise<any>'} => detects Promise generic", () => {
      const result = PatternUtils.checkContent({
        content: 'function getData(): Promise<any> { return fetch("/api"); }',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'const obj: Record<string, any> = {};'} => detects Record generic", () => {
      const result = PatternUtils.checkContent({
        content: 'const obj: Record<string, any> = {};',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'type Handler = (x: any) => void;'} => detects function type", () => {
      const result = PatternUtils.checkContent({
        content: 'type Handler = (x: any) => void;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'type Complex = { data: { items: any[] } };'} => detects nested any", () => {
      const result = PatternUtils.checkContent({
        content: 'type Complex = { data: { items: any[] } };',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });
  });

  describe('buildErrorMessage()', () => {
    // VALID cases
    it("VALID: {violations: ['Error 1', 'Error 2']} => returns formatted error message", () => {
      const result = PatternUtils.buildErrorMessage({
        violations: ['Error 1', 'Error 2'],
      });
      expect(result).toBe(
        [
          '🛑 Code quality escape hatches detected:',
          '  ❌ Error 1',
          '  ❌ Error 2',
          '',
          'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
        ].join('\n'),
      );
    });

    it("VALID: {violations: ['Single error']} => returns formatted single error message", () => {
      const result = PatternUtils.buildErrorMessage({
        violations: ['Single error'],
      });
      expect(result).toBe(
        [
          '🛑 Code quality escape hatches detected:',
          '  ❌ Single error',
          '',
          'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
        ].join('\n'),
      );
    });

    // EDGE cases
    it('EDGE: {violations: []} => returns header and footer only', () => {
      const result = PatternUtils.buildErrorMessage({
        violations: [],
      });
      expect(result).toBe(
        [
          '🛑 Code quality escape hatches detected:',
          '',
          'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
        ].join('\n'),
      );
    });
  });

  describe('ESLint disable pattern variations', () => {
    it("VALID: {content: '/* eslint-disable */\\ncode'} => detects block comment disable", () => {
      const result = PatternUtils.checkContent({
        content: '/* eslint-disable */\nconst unused = 5;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['eslint-disable']));
    });

    it("VALID: {content: '// eslint-disable-next-line\\ncode'} => detects next-line disable", () => {
      const result = PatternUtils.checkContent({
        content: '// eslint-disable-next-line\nconst unused = 5;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['eslint-disable']));
    });

    it("VALID: {content: 'code // eslint-disable-line'} => detects disable-line", () => {
      const result = PatternUtils.checkContent({
        content: 'const unused = 5; // eslint-disable-line',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['eslint-disable']));
    });

    it("EDGE: {content: 'multiple eslint variations'} => returns single violation", () => {
      const result = PatternUtils.checkContent({
        content:
          '/* eslint-disable */\n// eslint-disable-next-line\nconst unused = 5; // eslint-disable-line',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['eslint-disable']));
    });
  });

  describe('Case sensitivity and identifier handling', () => {
    it("EDGE: {content: '// @TS-IGNORE\\ncode'} => returns no violations (case sensitive)", () => {
      const result = PatternUtils.checkContent({
        content: '// @TS-IGNORE\nconst value = invalidCode;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([]);
      expect(result.types).toStrictEqual(new Set());
    });

    it("EDGE: {content: '// @Ts-Ignore\\ncode'} => returns no violations (case sensitive)", () => {
      const result = PatternUtils.checkContent({
        content: '// @Ts-Ignore\nconst value = invalidCode;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([]);
      expect(result.types).toStrictEqual(new Set());
    });

    it("VALID: {content: 'variable names containing any'} => returns no violations", () => {
      const result = PatternUtils.checkContent({
        content: 'const handleAny = () => {};\nconst anyValue = 42;\nconst company = "Any Corp";',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([]);
      expect(result.types).toStrictEqual(new Set());
    });

    it("VALID: {content: 'property name any'} => detects any keyword", () => {
      const result = PatternUtils.checkContent({
        content: 'const config = { any: true, some: { any: false } };',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });
  });

  describe('Complex whitespace and syntax patterns', () => {
    it("EDGE: {content: 'function test(param:     any)'} => detects with multiple spaces", () => {
      const result = PatternUtils.checkContent({
        content: 'function test(param:     any) { return param; }',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'const value = someVar as\\tany;'} => detects with tab", () => {
      const result = PatternUtils.checkContent({
        content: 'const value = someVar as\tany;',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it('EDGE: {content: \'const name:any = "test";\'} => detects with no space after colon', () => {
      const result = PatternUtils.checkContent({
        content: 'const name:any = "test";',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'const arr: [any,any] = [1, 2];'} => detects with no spaces in array", () => {
      const result = PatternUtils.checkContent({
        content: 'const arr: [any,any] = [1, 2];',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("EDGE: {content: 'type Obj = {x:any,y:any};'} => detects with no spaces in object", () => {
      const result = PatternUtils.checkContent({
        content: 'type Obj = {x:any,y:any};',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });
  });

  describe('String literal detection behavior', () => {
    it("VALID: {content: 'any in string literals', stripStrings: false} => detects any keyword", () => {
      const result = PatternUtils.checkContent({
        content:
          'const message = "You can use any value here";\nconst comment = \'This accepts any type of input\';',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("VALID: {content: 'any in comments', stripStrings: false} => detects any keyword", () => {
      const result = PatternUtils.checkContent({
        content:
          '// This function can handle any type of input\n/* You can pass any value to this function */\nexport function process(value: unknown): string {\n  return String(value);\n}',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("VALID: {content: 'URL containing /any'} => detects any keyword", () => {
      const result = PatternUtils.checkContent({
        content: 'const url = "https://example.com/any/endpoint";',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("VALID: {content: 'URL containing @ts-ignore'} => detects ts-ignore", () => {
      const result = PatternUtils.checkContent({
        content: 'const docUrl = "https://docs.com/@ts-ignore-usage";',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['ts-ignore']));
    });

    it("VALID: {content: 'escaped quotes with : any'} => detects any", () => {
      const result = PatternUtils.checkContent({
        content: 'const msg = "He said \\"use : any\\" in TypeScript";',
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['any-keyword']));
    });

    it("VALID: {content: 'escaped quotes with @ts-ignore'} => detects ts-ignore", () => {
      const result = PatternUtils.checkContent({
        content: "const note = 'Don\\'t use @ts-ignore';",
        stripStrings: false,
      });
      expect(result.violations).toStrictEqual([
        "Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
      ]);
      expect(result.types).toStrictEqual(new Set(['ts-ignore']));
    });
  });

  describe('processEscapeHatchisms()', () => {
    // VALID cases
    it("VALID: {content: 'let x: any = 5;'} => returns found true with error message", () => {
      const result = PatternUtils.processEscapeHatchisms({
        content: 'let x: any = 5;',
      });
      expect(result.found).toBe(true);
      expect(result.message).toBe(
        [
          '🛑 Code quality escape hatches detected:',
          "  ❌ Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          '',
          'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
        ].join('\n'),
      );
    });

    it("VALID: {content: 'clean code'} => returns found false with empty message", () => {
      const result = PatternUtils.processEscapeHatchisms({
        content: 'clean code',
      });
      expect(result.found).toBe(false);
      expect(result.message).toBe('');
    });

    it("VALID: {content: 'any', filePath: 'test.ts'} => returns found true with error message", () => {
      const result = PatternUtils.processEscapeHatchisms({
        content: 'any',
        filePath: 'test.ts',
      });
      expect(result.found).toBe(true);
      expect(result.message).toBe(
        [
          '🛑 Code quality escape hatches detected:',
          "  ❌ Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          '',
          'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
        ].join('\n'),
      );
    });

    it("VALID: {content: 'any', filePath: 'test.md'} => returns found false with empty message", () => {
      const result = PatternUtils.processEscapeHatchisms({
        content: 'any',
        filePath: 'test.md',
      });
      expect(result.found).toBe(false);
      expect(result.message).toBe('');
    });

    // EMPTY cases
    it("EMPTY: {content: ''} => returns found false with empty message", () => {
      const result = PatternUtils.processEscapeHatchisms({
        content: '',
      });
      expect(result.found).toBe(false);
      expect(result.message).toBe('');
    });

    it("EMPTY: {content: '', filePath: 'test.ts'} => returns found false with empty message", () => {
      const result = PatternUtils.processEscapeHatchisms({
        content: '',
        filePath: 'test.ts',
      });
      expect(result.found).toBe(false);
      expect(result.message).toBe('');
    });
  });

  describe('processEscapeHatchismsInCode()', () => {
    // VALID cases
    it("VALID: {content: 'let x: any = 5;'} => returns found true with error message", () => {
      const result = PatternUtils.processEscapeHatchismsInCode({
        content: 'let x: any = 5;',
      });
      expect(result.found).toBe(true);
      expect(result.message).toBe(
        [
          '🛑 Code quality escape hatches detected:',
          "  ❌ Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          '',
          'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
        ].join('\n'),
      );
    });

    it('VALID: {content: \'const str = "any";\'} => returns found false with empty message', () => {
      const result = PatternUtils.processEscapeHatchismsInCode({
        content: 'const str = "any";',
      });
      expect(result.found).toBe(false);
      expect(result.message).toBe('');
    });

    it("VALID: {content: '// any comment\\ncode'} => returns found false with empty message", () => {
      const result = PatternUtils.processEscapeHatchismsInCode({
        content: '// any comment\ncode',
      });
      expect(result.found).toBe(false);
      expect(result.message).toBe('');
    });

    it("VALID: {content: '// @ts-ignore\\ncode'} => returns found true with error message", () => {
      const result = PatternUtils.processEscapeHatchismsInCode({
        content: '// @ts-ignore\ncode',
      });
      expect(result.found).toBe(true);
      expect(result.message).toBe(
        [
          '🛑 Code quality escape hatches detected:',
          "  ❌ Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          '',
          'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
        ].join('\n'),
      );
    });

    it("VALID: {content: 'any', filePath: 'test.ts'} => returns found true with error message", () => {
      const result = PatternUtils.processEscapeHatchismsInCode({
        content: 'any',
        filePath: 'test.ts',
      });
      expect(result.found).toBe(true);
      expect(result.message).toBe(
        [
          '🛑 Code quality escape hatches detected:',
          "  ❌ Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          '',
          'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
        ].join('\n'),
      );
    });

    // EMPTY cases
    it("EMPTY: {content: ''} => returns found false with empty message", () => {
      const result = PatternUtils.processEscapeHatchismsInCode({
        content: '',
      });
      expect(result.found).toBe(false);
      expect(result.message).toBe('');
    });

    it("EMPTY: {content: '', filePath: 'test.ts'} => returns found false with empty message", () => {
      const result = PatternUtils.processEscapeHatchismsInCode({
        content: '',
        filePath: 'test.ts',
      });
      expect(result.found).toBe(false);
      expect(result.message).toBe('');
    });
  });

  describe('hasNewEscapeHatches()', () => {
    // VALID cases
    it("VALID: {oldContent: 'clean', newContent: 'any'} => returns true", () => {
      const result = PatternUtils.hasNewEscapeHatches({
        oldContent: 'clean',
        newContent: 'any',
      });
      expect(result).toBe(true);
    });

    it("VALID: {oldContent: 'any', newContent: 'any'} => returns false", () => {
      const result = PatternUtils.hasNewEscapeHatches({
        oldContent: 'any',
        newContent: 'any',
      });
      expect(result).toBe(false);
    });

    it("VALID: {oldContent: 'any', newContent: 'clean'} => returns false", () => {
      const result = PatternUtils.hasNewEscapeHatches({
        oldContent: 'any',
        newContent: 'clean',
      });
      expect(result).toBe(false);
    });

    it("VALID: {oldContent: 'any', newContent: 'any + @ts-ignore'} => returns true", () => {
      const result = PatternUtils.hasNewEscapeHatches({
        oldContent: 'any',
        newContent: 'any // @ts-ignore',
      });
      expect(result).toBe(true);
    });

    it("VALID: {oldContent: 'any', newContent: 'any', filePath: 'test.ts'} => returns false", () => {
      const result = PatternUtils.hasNewEscapeHatches({
        oldContent: 'any',
        newContent: 'any',
        filePath: 'test.ts',
      });
      expect(result).toBe(false);
    });

    it("VALID: {oldContent: 'clean', newContent: 'any', filePath: 'test.md'} => returns false", () => {
      const result = PatternUtils.hasNewEscapeHatches({
        oldContent: 'clean',
        newContent: 'any',
        filePath: 'test.md',
      });
      expect(result).toBe(false);
    });

    // String literal handling
    it("VALID: {oldContent: 'clean', newContent: 'const str = \"any\";'} => returns false", () => {
      const result = PatternUtils.hasNewEscapeHatches({
        oldContent: 'clean',
        newContent: 'const str = "any";',
      });
      expect(result).toBe(false);
    });

    it("VALID: {oldContent: '// any comment', newContent: 'let x: any;'} => returns true", () => {
      const result = PatternUtils.hasNewEscapeHatches({
        oldContent: '// any comment',
        newContent: 'let x: any;',
      });
      expect(result).toBe(true);
    });

    // EMPTY cases
    it("EMPTY: {oldContent: '', newContent: ''} => returns false", () => {
      const result = PatternUtils.hasNewEscapeHatches({
        oldContent: '',
        newContent: '',
      });
      expect(result).toBe(false);
    });

    it("EMPTY: {oldContent: '', newContent: 'any'} => returns true", () => {
      const result = PatternUtils.hasNewEscapeHatches({
        oldContent: '',
        newContent: 'any',
      });
      expect(result).toBe(true);
    });

    it("EMPTY: {oldContent: 'any', newContent: ''} => returns false", () => {
      const result = PatternUtils.hasNewEscapeHatches({
        oldContent: 'any',
        newContent: '',
      });
      expect(result).toBe(false);
    });
  });

  describe('getNewEscapeHatchMessage()', () => {
    // VALID cases
    it("VALID: {oldContent: 'clean', newContent: 'any'} => returns error message", () => {
      const result = PatternUtils.getNewEscapeHatchMessage({
        oldContent: 'clean',
        newContent: 'any',
      });
      expect(result).toBe(
        [
          '🛑 Code quality escape hatches detected:',
          "  ❌ Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          '',
          'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
        ].join('\n'),
      );
    });

    it("VALID: {oldContent: 'any', newContent: 'clean'} => returns empty message", () => {
      const result = PatternUtils.getNewEscapeHatchMessage({
        oldContent: 'any',
        newContent: 'clean',
      });
      expect(result).toBe('');
    });

    it("VALID: {oldContent: 'clean', newContent: 'any', filePath: 'test.ts'} => returns error message", () => {
      const result = PatternUtils.getNewEscapeHatchMessage({
        oldContent: 'clean',
        newContent: 'any',
        filePath: 'test.ts',
      });
      expect(result).toBe(
        [
          '🛑 Code quality escape hatches detected:',
          "  ❌ Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          '',
          'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
        ].join('\n'),
      );
    });

    it("VALID: {oldContent: 'clean', newContent: 'const str = \"any\";'} => returns empty message", () => {
      const result = PatternUtils.getNewEscapeHatchMessage({
        oldContent: 'clean',
        newContent: 'const str = "any";',
      });
      expect(result).toBe('');
    });

    // EMPTY cases
    it("EMPTY: {oldContent: '', newContent: ''} => returns empty message", () => {
      const result = PatternUtils.getNewEscapeHatchMessage({
        oldContent: '',
        newContent: '',
      });
      expect(result).toBe('');
    });

    it("EMPTY: {oldContent: '', newContent: 'any'} => returns error message", () => {
      const result = PatternUtils.getNewEscapeHatchMessage({
        oldContent: '',
        newContent: 'any',
      });
      expect(result).toBe(
        [
          '🛑 Code quality escape hatches detected:',
          "  ❌ Found 'any' type - This bypasses TypeScript's type safety. Use specific types, 'unknown', or generic constraints instead. Take a step back, breath for a moment, and think through the issue at a high-level",
          '',
          'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
        ].join('\n'),
      );
    });
  });
});
