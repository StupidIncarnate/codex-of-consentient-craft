import { globPatternContract as _globPatternContract } from './glob-pattern-contract';
import { GlobPatternStub } from './glob-pattern.stub';

describe('globPatternContract', () => {
  it('VALID: {value: "**/*.ts"} => parses successfully', () => {
    const result = GlobPatternStub({ value: '**/*.ts' });

    expect(result).toBe('**/*.ts');
  });

  it('VALID: {value: "src/guards/**/*.ts"} => parses successfully', () => {
    const result = GlobPatternStub({ value: 'src/guards/**/*.ts' });

    expect(result).toBe('src/guards/**/*.ts');
  });

  it('VALID: {value: "**/*.{ts,tsx}"} => parses successfully', () => {
    const result = GlobPatternStub({ value: '**/*.{ts,tsx}' });

    expect(result).toBe('**/*.{ts,tsx}');
  });

  it('VALID: {value: single file pattern} => parses successfully', () => {
    const result = GlobPatternStub({ value: 'test.ts' });

    expect(result).toBe('test.ts');
  });

  it('VALID: {value: negation pattern} => parses successfully', () => {
    const result = GlobPatternStub({ value: '!node_modules/**' });

    expect(result).toBe('!node_modules/**');
  });

  it('VALID: {value: empty string} => parses successfully', () => {
    const result = GlobPatternStub({ value: '' });

    expect(result).toBe('');
  });
});
