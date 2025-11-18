import { globPatternContract as _globPatternContract } from './glob-pattern-contract';
import { GlobPatternStub } from './glob-pattern.stub';

describe('globPatternContract', () => {
  it('VALID: {value: "**/*.ts"} => parses successfully', () => {
    const result = GlobPatternStub({ value: '**/*.ts' });

    expect(result).toBe('**/*.ts');
  });

  it('VALID: {value: "src/**/*.tsx"} => parses successfully', () => {
    const result = GlobPatternStub({ value: 'src/**/*.tsx' });

    expect(result).toBe('src/**/*.tsx');
  });

  it('VALID: {value: "*.js"} => parses successfully', () => {
    const result = GlobPatternStub({ value: '*.js' });

    expect(result).toBe('*.js');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = GlobPatternStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: "*"} => parses successfully', () => {
    const result = GlobPatternStub({ value: '*' });

    expect(result).toBe('*');
  });

  it('VALID: {value: "?"} => parses successfully', () => {
    const result = GlobPatternStub({ value: '?' });

    expect(result).toBe('?');
  });

  it('VALID: {value: "**/*"} => parses successfully', () => {
    const result = GlobPatternStub({ value: '**/*' });

    expect(result).toBe('**/*');
  });

  it('VALID: {value: "*.{ts,tsx,js,jsx}"} => parses successfully', () => {
    const result = GlobPatternStub({ value: '*.{ts,tsx,js,jsx}' });

    expect(result).toBe('*.{ts,tsx,js,jsx}');
  });

  it('VALID: {value: "!node_modules/**"} => parses successfully', () => {
    const result = GlobPatternStub({ value: '!node_modules/**' });

    expect(result).toBe('!node_modules/**');
  });

  it('VALID: {value: "[abc]*.ts"} => parses successfully', () => {
    const result = GlobPatternStub({ value: '[abc]*.ts' });

    expect(result).toBe('[abc]*.ts');
  });

  it('VALID: {value: "path with spaces/**/*.ts"} => parses successfully', () => {
    const result = GlobPatternStub({ value: 'path with spaces/**/*.ts' });

    expect(result).toBe('path with spaces/**/*.ts');
  });
});
