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
});
