import { toolingRequirementIdContract } from './tooling-requirement-id-contract';
import { ToolingRequirementIdStub } from './tooling-requirement-id.stub';

describe('toolingRequirementIdContract', () => {
  it('VALID: {value: kebab-case} => parses successfully', () => {
    const id = ToolingRequirementIdStub({ value: 'pg-driver' });

    expect(id).toBe('pg-driver');
  });

  it('VALID: {default value} => uses default kebab-case', () => {
    const id = ToolingRequirementIdStub();

    expect(id).toBe('pg-driver');
  });

  it('VALID: {single word} => parses successfully', () => {
    const id = ToolingRequirementIdStub({ value: 'jest' });

    expect(id).toBe('jest');
  });

  it('INVALID_ID: {value: "Not-Kebab"} => throws validation error', () => {
    expect(() => {
      return toolingRequirementIdContract.parse('Not-Kebab');
    }).toThrow(/invalid_string/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return toolingRequirementIdContract.parse('');
    }).toThrow(/too_small/u);
  });
});
