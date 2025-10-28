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
});
