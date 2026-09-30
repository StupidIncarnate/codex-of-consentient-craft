import { typescriptParseBroker } from './typescript-parse-broker';
import { typescriptParseBrokerProxy } from './typescript-parse-broker.proxy';

describe('typescriptParseBroker', () => {
  it('VALID: {sourceCode with string literals} => returns map with literal occurrences', () => {
    typescriptParseBrokerProxy();
    const sourceCode = 'const x = "test"; const y = "test";';
    const filePath = '/file.ts';

    const result = typescriptParseBroker({ sourceCode, filePath });

    const testOccurrences = result.get('test');

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
    typescriptParseBrokerProxy();
    const sourceCode = 'const pattern = /test/g;';
    const filePath = '/file.ts';

    const result = typescriptParseBroker({ sourceCode, filePath });

    const regexOccurrences = result.get('/test/g');

    expect(regexOccurrences).toStrictEqual([
      {
        filePath: '/file.ts',
        line: 1,
        column: 16,
      },
    ]);
  });

  it('VALID: {sourceCode with minLength: 5} => excludes short strings', () => {
    typescriptParseBrokerProxy();
    const sourceCode = 'const x = "hi"; const y = "hello";';
    const filePath = '/file.ts';

    const result = typescriptParseBroker({ sourceCode, filePath, minLength: 5 });

    expect(result.has('hi')).toBe(false);
    expect(result.has('hello')).toBe(true);
  });

  it('EMPTY: {sourceCode without literals} => returns empty map', () => {
    typescriptParseBrokerProxy();
    const sourceCode = 'const x = 123; const y = true;';
    const filePath = '/file.ts';

    const result = typescriptParseBroker({ sourceCode, filePath });

    expect(result.size).toBe(0);
  });

  it('VALID: {sourceCode with duplicate across lines} => returns all occurrences', () => {
    typescriptParseBrokerProxy();
    const sourceCode = `const error = "error";
const message = "error";
const type = "error";`;
    const filePath = '/file.ts';

    const result = typescriptParseBroker({ sourceCode, filePath });

    const errorOccurrences = result.get('error');

    expect(errorOccurrences).toStrictEqual([
      { filePath: '/file.ts', line: 3, column: 13 },
      { filePath: '/file.ts', line: 2, column: 16 },
      { filePath: '/file.ts', line: 1, column: 14 },
    ]);
  });

  describe('branch coverage', () => {
    it('VALID: {single occurrence of literal} => creates new map entry', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "unique";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const uniqueOccurrences = result.get('unique');

      expect(uniqueOccurrences).toStrictEqual([{ filePath: '/file.ts', line: 1, column: 10 }]);
    });

    it('VALID: {multiple occurrences of literal} => updates existing map entry', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "repeat"; const y = "repeat"; const z = "repeat";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const repeatOccurrences = result.get('repeat');

      expect(repeatOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 50 },
        { filePath: '/file.ts', line: 1, column: 30 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });
  });

  describe('source code edge cases', () => {
    it('EMPTY: {empty source code} => returns empty map', () => {
      typescriptParseBrokerProxy();
      const sourceCode = '';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      expect(result.size).toBe(0);
    });

    it('EMPTY: {only comments} => returns empty map', () => {
      typescriptParseBrokerProxy();
      const sourceCode = `// This is a comment
/* This is a block comment */`;
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      expect(result.size).toBe(0);
    });

    it('VALID: {template literals} => parses string content', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = `template`; const y = `template`;';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      expect(result.size).toBe(0);
    });

    it('VALID: {nested objects} => parses string literals in objects', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const obj = { nested: { value: "deep" } }; const obj2 = { value: "deep" };';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const deepOccurrences = result.get('deep');

      expect(deepOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 65 },
        { filePath: '/file.ts', line: 1, column: 31 },
      ]);
    });

    it('VALID: {arrays} => parses string literals in arrays', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const arr = ["item", "item", "item"];';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const itemOccurrences = result.get('item');

      expect(itemOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 29 },
        { filePath: '/file.ts', line: 1, column: 21 },
        { filePath: '/file.ts', line: 1, column: 13 },
      ]);
    });

    it('VALID: {default arguments} => parses string literals in defaults', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'function fn(x = "default", y = "default") {}';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const defaultOccurrences = result.get('default');

      expect(defaultOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 31 },
        { filePath: '/file.ts', line: 1, column: 16 },
      ]);
    });

    it('VALID: {JSX elements} => parses string literals in JSX', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const el = <div title="title">{"text"}</div>; const el2 = <span>{"text"}</span>;';
      const filePath = '/file.tsx';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const textOccurrences = result.get('text');
      const titleOccurrences = result.get('title');

      expect(textOccurrences).toStrictEqual([
        { filePath: '/file.tsx', line: 1, column: 65 },
        { filePath: '/file.tsx', line: 1, column: 31 },
      ]);
      expect(titleOccurrences).toStrictEqual([{ filePath: '/file.tsx', line: 1, column: 22 }]);
    });

    it('VALID: {import statements} => parses string literals in imports', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'import { x } from "module"; import { y } from "module";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const moduleOccurrences = result.get('module');

      expect(moduleOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 46 },
        { filePath: '/file.ts', line: 1, column: 18 },
      ]);
    });

    it('VALID: {type annotations} => parses string literal types', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'type Status = "active" | "inactive"; const x: "active" = "active";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const activeOccurrences = result.get('active');
      const inactiveOccurrences = result.get('inactive');

      expect(activeOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 57 },
        { filePath: '/file.ts', line: 1, column: 46 },
        { filePath: '/file.ts', line: 1, column: 14 },
      ]);
      expect(inactiveOccurrences).toStrictEqual([{ filePath: '/file.ts', line: 1, column: 25 }]);
    });

    it('EDGE: {string exactly at minLength} => includes string', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "abc"; const y = "abc";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath, minLength: 3 });

      const abcOccurrences = result.get('abc');

      expect(abcOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 27 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('EDGE: {string one char below minLength} => excludes string', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "ab"; const y = "ab";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath, minLength: 3 });

      expect(result.has('ab')).toBe(false);
    });
  });

  describe('minLength variations', () => {
    it('VALID: {minLength: 0} => includes empty strings', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = ""; const y = "";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath, minLength: 0 });

      const emptyOccurrences = result.get('');

      expect(emptyOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 24 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {minLength: 1} => includes single character strings', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "a"; const y = "a";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath, minLength: 1 });

      const aOccurrences = result.get('a');

      expect(aOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 25 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {minLength: 1000} => excludes all normal strings', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "short"; const y = "short";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath, minLength: 1000 });

      expect(result.has('short')).toBe(false);
    });
  });

  describe('special string content', () => {
    it('VALID: {unicode characters} => handles unicode correctly', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "Hello 👋"; const y = "Hello 👋";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const unicodeOccurrences = result.get('Hello 👋');

      expect(unicodeOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 32 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {strings with backslashes} => handles escape sequences', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "path\\\\to\\\\file"; const y = "path\\\\to\\\\file";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const pathOccurrences = result.get('path\\to\\file');

      expect(pathOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 38 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {newlines in strings} => handles newline characters correctly', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "line1\\nline2"; const y = "line1\\nline2";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const newlineOccurrences = result.get('line1\nline2');

      expect(newlineOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 36 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {very long strings} => handles long strings correctly', () => {
      typescriptParseBrokerProxy();
      const longString = 'a'.repeat(10000);
      const sourceCode = `const x = "${longString}"; const y = "${longString}";`;
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const longOccurrences = result.get(longString);

      expect(longOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 10024 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {whitespace-only strings} => handles whitespace strings', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "   "; const y = "   ";';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const whitespaceOccurrences = result.get('   ');

      expect(whitespaceOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 27 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });
  });

  describe('invalid TypeScript', () => {
    it('VALID: {syntax errors} => parser is resilient to errors', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "error"; const y = "error"; invalid syntax here';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const errorOccurrences = result.get('error');

      expect(errorOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 29 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {incomplete tokens} => parses what it can', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const x = "complete"; const y = "complete"; const z = "incom';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const completeOccurrences = result.get('complete');

      expect(completeOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 32 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
    });

    it('VALID: {mixed quotes} => handles single and double quotes', () => {
      typescriptParseBrokerProxy();
      const sourceCode = "const x = 'single'; const y = \"double\"; const z = 'single';";
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const singleOccurrences = result.get('single');
      const doubleOccurrences = result.get('double');

      expect(singleOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 50 },
        { filePath: '/file.ts', line: 1, column: 10 },
      ]);
      expect(doubleOccurrences).toStrictEqual([{ filePath: '/file.ts', line: 1, column: 30 }]);
    });
  });

  describe('regex variations', () => {
    it('VALID: {regex with different flags} => handles various flags', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const p1 = /test/gi; const p2 = /test/m; const p3 = /test/gi;';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const giOccurrences = result.get('/test/gi');
      const mOccurrences = result.get('/test/m');

      expect(giOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 52 },
        { filePath: '/file.ts', line: 1, column: 11 },
      ]);
      expect(mOccurrences).toStrictEqual([{ filePath: '/file.ts', line: 1, column: 32 }]);
    });

    it('VALID: {complex regex patterns} => handles complex patterns', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const email = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-z]{2,}$/; const email2 = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-z]{2,}$/;';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const emailOccurrences = result.get(
        '/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-z]{2,}$/',
      );

      expect(emailOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 71 },
        { filePath: '/file.ts', line: 1, column: 14 },
      ]);
    });

    it('VALID: {duplicate regex patterns} => tracks regex duplicates', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const p1 = /\\d+/; const p2 = /\\d+/; const p3 = /\\d+/; const p4 = /\\d+/;';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const digitOccurrences = result.get('/\\d+/');

      expect(digitOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 65 },
        { filePath: '/file.ts', line: 1, column: 47 },
        { filePath: '/file.ts', line: 1, column: 29 },
        { filePath: '/file.ts', line: 1, column: 11 },
      ]);
    });

    it('VALID: {escaped characters in regex} => handles escaped chars', () => {
      typescriptParseBrokerProxy();
      const sourceCode = 'const p1 = /\\d+\\.\\d+/; const p2 = /\\d+\\.\\d+/; const p3 = /\\d+\\.\\d+/;';
      const filePath = '/file.ts';

      const result = typescriptParseBroker({ sourceCode, filePath });

      const decimalOccurrences = result.get('/\\d+\\.\\d+/');

      expect(decimalOccurrences).toStrictEqual([
        { filePath: '/file.ts', line: 1, column: 57 },
        { filePath: '/file.ts', line: 1, column: 34 },
        { filePath: '/file.ts', line: 1, column: 11 },
      ]);
    });
  });
});
