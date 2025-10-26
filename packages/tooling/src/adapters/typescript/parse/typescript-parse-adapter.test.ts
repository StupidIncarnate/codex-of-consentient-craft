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

    expect(testOccurrences).toBeDefined();
    expect(testOccurrences).toHaveLength(2);
    expect(testOccurrences?.[0]).toStrictEqual({
      filePath: '/file.ts',
      line: 1,
      column: 28,
    });
    expect(testOccurrences?.[1]).toStrictEqual({
      filePath: '/file.ts',
      line: 1,
      column: 10,
    });
  });

  it('VALID: {sourceCode with regex literals} => returns map with regex occurrences', () => {
    typescriptParseAdapterProxy();
    const sourceCode = SourceCodeStub({ value: 'const pattern = /test/g;' });
    const filePath = AbsoluteFilePathStub({ value: '/file.ts' });

    const result = typescriptParseAdapter({ sourceCode, filePath });

    const regexOccurrences = result.get(LiteralValueStub({ value: '/test/g' }));

    expect(regexOccurrences).toBeDefined();
    expect(regexOccurrences).toHaveLength(1);
    expect(regexOccurrences?.[0]).toStrictEqual({
      filePath: '/file.ts',
      line: 1,
      column: 16,
    });
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

    expect(errorOccurrences).toBeDefined();
    expect(errorOccurrences).toHaveLength(3);
    expect(errorOccurrences?.[0]?.line).toBe(3);
    expect(errorOccurrences?.[1]?.line).toBe(2);
    expect(errorOccurrences?.[2]?.line).toBe(1);
  });
});
