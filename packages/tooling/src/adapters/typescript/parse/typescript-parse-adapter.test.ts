import { typescriptParseAdapter } from './typescript-parse-adapter';
import { typescriptParseAdapterProxy } from './typescript-parse-adapter.proxy';
import { SourceCodeStub } from '../../../contracts/source-code/source-code.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { LiteralValueStub } from '../../../contracts/literal-value/literal-value.stub';

describe('typescriptParseAdapter', () => {
  it('VALID: {sourceCode with string literals} => returns map with literal occurrences', () => {
    typescriptParseAdapterProxy();
    const sourceCode = SourceCodeStub({ value: 'const x = "test"; const y = "test";' });
    const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

    const result = typescriptParseAdapter({ sourceCode, filePath });

    const testOccurrences = result.get(LiteralValueStub({ value: 'test' }));

    expect(testOccurrences).toStrictEqual([
      {
        filePath: '/file.ts',
        line: 1,
        column: 28,
      },
      {
        filePath: '/file.ts',
        line: 1,
        column: 10,
      },
    ]);
  });

  it('VALID: {sourceCode with regex literals} => returns map with regex occurrences', () => {
    typescriptParseAdapterProxy();
    const sourceCode = SourceCodeStub({ value: 'const pattern = /test/g;' });
    const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

    const result = typescriptParseAdapter({ sourceCode, filePath });

    const regexOccurrences = result.get(LiteralValueStub({ value: '/test/g' }));

    expect(regexOccurrences).toStrictEqual([
      {
        filePath: '/file.ts',
        line: 1,
        column: 16,
      },
    ]);
  });

  it('VALID: {sourceCode with minLength: 5} => excludes short strings', () => {
    typescriptParseAdapterProxy();
    const sourceCode = SourceCodeStub({
      value: 'const x = "hi"; const y = "hello";',
    });
    const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

    const result = typescriptParseAdapter({ sourceCode, filePath, minLength: 5 });

    expect(result.has(LiteralValueStub({ value: 'hi' }))).toBe(false);
    expect(result.has(LiteralValueStub({ value: 'hello' }))).toBe(true);
  });

  it('EMPTY: {sourceCode without literals} => returns empty map', () => {
    typescriptParseAdapterProxy();
    const sourceCode = SourceCodeStub({ value: 'const x = 123; const y = true;' });
    const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

    const result = typescriptParseAdapter({ sourceCode, filePath });

    expect(result.size).toBe(0);
  });

  it('VALID: {sourceCode with duplicate across lines} => returns all occurrences', () => {
    typescriptParseAdapterProxy();
    const sourceCode = SourceCodeStub({
      value: `const error = "error";
const message = "error";
const type = "error";`,
    });
    const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

    const result = typescriptParseAdapter({ sourceCode, filePath });

    const errorOccurrences = result.get(LiteralValueStub({ value: 'error' }));

    expect(errorOccurrences).toStrictEqual([
      { filePath: '/file.ts', line: 3, column: 13 },
      { filePath: '/file.ts', line: 2, column: 16 },
      { filePath: '/file.ts', line: 1, column: 14 },
    ]);
  });

  describe('branch coverage', () => {
    it('VALID: {single occurrence of literal} => creates new map entry', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({ value: 'const x = "unique";' });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const uniqueOccurrences = result.get(LiteralValueStub({ value: 'unique' }));

      expect(uniqueOccurrences).toStrictEqual([{ filePath: '/file.ts', line: 1, column: 10 }]);
    });

    it('VALID: {multiple occurrences of literal} => updates existing map entry', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const x = "repeat"; const y = "repeat"; const z = "repeat";',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const repeatOccurrences = result.get(LiteralValueStub({ value: 'repeat' }));

      expect(repeatOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 50 },
        { filePath: '/file.ts', line: 1, column: 30 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });
  });

  describe('source code edge cases', () => {
    it('EMPTY: {empty source code} => returns empty map', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({ value: '' });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      expect(result.size).toBe(0);
    });

    it('EMPTY: {only comments} => returns empty map', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: `// This is a comment
/* This is a block comment */`,
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      expect(result.size).toBe(0);
    });

    it('VALID: {template literals} => parses string content', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const x = `template`; const y = `template`;',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      expect(result.size).toBe(0);
    });

    it('VALID: {nested objects} => parses string literals in objects', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const obj = { nested: { value: "deep" } }; const obj2 = { value: "deep" };',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const deepOccurrences = result.get(LiteralValueStub({ value: 'deep' }));

      expect(deepOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 65 },
        { filePath: '/file.ts', line: 1, column: 31 },
      ]);
    });

    it('VALID: {arrays} => parses string literals in arrays', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const arr = ["item", "item", "item"];',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const itemOccurrences = result.get(LiteralValueStub({ value: 'item' }));

      expect(itemOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 29 },
        { filePath: '/file.ts', line: 1, column: 21 },
        { filePath: '/file.ts', line: 1, column: 13 },
      ]);
    });

    it('VALID: {default arguments} => parses string literals in defaults', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'function fn(x = "default", y = "default") {}',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const defaultOccurrences = result.get(LiteralValueStub({ value: 'default' }));

      expect(defaultOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 31 },
        { filePath: '/file.ts', line: 1, column: 16 },
      ]);
    });

    it('VALID: {JSX elements} => parses string literals in JSX', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const el = <div title="title">{"text"}</div>; const el2 = <span>{"text"}</span>;',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.tsx' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const textOccurrences = result.get(LiteralValueStub({ value: 'text' }));
      const titleOccurrences = result.get(LiteralValueStub({ value: 'title' }));

      expect(textOccurrences).toStrictEqual([
        { filePath: '/file.tsx', line: 1, column: 65 },
        { filePath: '/file.tsx', line: 1, column: 31 },
      ]);
      expect(titleOccurrences).toStrictEqual([{ filePath: '/file.tsx', line: 1, column: 22 }]);
    });

    it('VALID: {import statements} => parses string literals in imports', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'import { x } from "module"; import { y } from "module";',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const moduleOccurrences = result.get(LiteralValueStub({ value: 'module' }));

      expect(moduleOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 46 },
        { filePath: '/file.ts', line: 1, column: 18 },
      ]);
    });

    it('VALID: {type annotations} => parses string literal types', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'type Status = "active" | "inactive"; const x: "active" = "active";',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const activeOccurrences = result.get(LiteralValueStub({ value: 'active' }));
      const inactiveOccurrences = result.get(LiteralValueStub({ value: 'inactive' }));

      expect(activeOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 57 },
        { filePath: '/file.ts', line: 1, column: 46 },
        { filePath: '/file.ts', line: 1, column: 14 },
      ]);
      expect(inactiveOccurrences).toStrictEqual([{ filePath: '/file.ts', line: 1, column: 25 }]);
    });

    it('EDGE: {string exactly at minLength} => includes string', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({ value: 'const x = "abc"; const y = "abc";' });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath, minLength: 3 });

      const abcOccurrences = result.get(LiteralValueStub({ value: 'abc' }));

      expect(abcOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 27 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('EDGE: {string one char below minLength} => excludes string', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({ value: 'const x = "ab"; const y = "ab";' });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath, minLength: 3 });

      expect(result.has(LiteralValueStub({ value: 'ab' }))).toBe(false);
    });
  });

  describe('minLength variations', () => {
    it('VALID: {minLength: 0} => includes empty strings', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({ value: 'const x = ""; const y = "";' });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath, minLength: 0 });

      const emptyOccurrences = result.get(LiteralValueStub({ value: '' }));

      expect(emptyOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 24 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {minLength: 1} => includes single character strings', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({ value: 'const x = "a"; const y = "a";' });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath, minLength: 1 });

      const aOccurrences = result.get(LiteralValueStub({ value: 'a' }));

      expect(aOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 25 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {minLength: 1000} => excludes all normal strings', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const x = "short"; const y = "short";',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath, minLength: 1000 });

      expect(result.has(LiteralValueStub({ value: 'short' }))).toBe(false);
    });
  });

  describe('special string content', () => {
    it('VALID: {unicode characters} => handles unicode correctly', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const x = "Hello 👋"; const y = "Hello 👋";',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const unicodeOccurrences = result.get(LiteralValueStub({ value: 'Hello 👋' }));

      expect(unicodeOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 32 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {strings with backslashes} => handles escape sequences', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const x = "path\\\\to\\\\file"; const y = "path\\\\to\\\\file";',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const pathOccurrences = result.get(LiteralValueStub({ value: 'path\\to\\file' }));

      expect(pathOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 38 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {newlines in strings} => handles newline characters correctly', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const x = "line1\\nline2"; const y = "line1\\nline2";',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const newlineOccurrences = result.get(LiteralValueStub({ value: 'line1\nline2' }));

      expect(newlineOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 36 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {very long strings} => handles long strings correctly', () => {
      typescriptParseAdapterProxy();
      const longString = 'a'.repeat(10000);
      const sourceCode = SourceCodeStub({
        value: `const x = "${longString}"; const y = "${longString}";`,
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const longOccurrences = result.get(LiteralValueStub({ value: longString }));

      expect(longOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 10024 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {whitespace-only strings} => handles whitespace strings', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const x = "   "; const y = "   ";',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const whitespaceOccurrences = result.get(LiteralValueStub({ value: '   ' }));

      expect(whitespaceOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 27 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });
  });

  describe('invalid TypeScript', () => {
    it('VALID: {syntax errors} => parser is resilient to errors', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const x = "error"; const y = "error"; invalid syntax here',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const errorOccurrences = result.get(LiteralValueStub({ value: 'error' }));

      expect(errorOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 29 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {incomplete tokens} => parses what it can', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const x = "complete"; const y = "complete"; const z = "incom',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const completeOccurrences = result.get(LiteralValueStub({ value: 'complete' }));

      expect(completeOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 32 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {mixed quotes} => handles single and double quotes', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: "const x = 'single'; const y = \"double\"; const z = 'single';",
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const singleOccurrences = result.get(LiteralValueStub({ value: 'single' }));
      const doubleOccurrences = result.get(LiteralValueStub({ value: 'double' }));

      expect(singleOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 50 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
      expect(doubleOccurrences).toStrictEqual([{ filePath: '/file.ts', line: 1, column: 30 }]);
    });
  });

  describe('regex variations', () => {
    it('VALID: {regex with different flags} => handles various flags', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const p1 = /test/gi; const p2 = /test/m; const p3 = /test/gi;',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const giOccurrences = result.get(LiteralValueStub({ value: '/test/gi' }));
      const mOccurrences = result.get(LiteralValueStub({ value: '/test/m' }));

      expect(giOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 52 },
        { filePath: '/file.ts', line: 1, column: 11 },
      ]);
      expect(mOccurrences).toStrictEqual([{ filePath: '/file.ts', line: 1, column: 32 }]);
    });

    it('VALID: {complex regex patterns} => handles complex patterns', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value:
          'const email = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-z]{2,}$/; const email2 = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-z]{2,}$/;',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const emailOccurrences = result.get(
        LiteralValueStub({ value: '/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-z]{2,}$/' }),
      );

      expect(emailOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 71 },
        { filePath: '/file.ts', line: 1, column: 14 },
      ]);
    });

    it('VALID: {duplicate regex patterns} => tracks regex duplicates', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const p1 = /\\d+/; const p2 = /\\d+/; const p3 = /\\d+/; const p4 = /\\d+/;',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const digitOccurrences = result.get(LiteralValueStub({ value: '/\\d+/' }));

      expect(digitOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 65 },
        { filePath: '/file.ts', line: 1, column: 47 },
        { filePath: '/file.ts', line: 1, column: 29 },
        { filePath: '/file.ts', line: 1, column: 11 },
      ]);
    });

    it('VALID: {escaped characters in regex} => handles escaped chars', () => {
      typescriptParseAdapterProxy();
      const sourceCode = SourceCodeStub({
        value: 'const p1 = /\\d+\\.\\d+/; const p2 = /\\d+\\.\\d+/; const p3 = /\\d+\\.\\d+/;',
      });
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

      const result = typescriptParseAdapter({ sourceCode, filePath });

      const decimalOccurrences = result.get(LiteralValueStub({ value: '/\\d+\\.\\d+/' }));

      expect(decimalOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 57 },
        { filePath: '/file.ts', line: 1, column: 34 },
        { filePath: '/file.ts', line: 1, column: 11 },
      ]);
    });
  });
});
