import { toolingRequirementIdContract } from './tooling-requirement-id-contract';
import { ToolingRequirementIdStub } from './tooling-requirement-id.stub';

describe('toolingRequirementIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = ToolingRequirementIdStub({ value: 'd4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a' });

    expect(id).toBe('d4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = ToolingRequirementIdStub();

    expect(id).toBe('d4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a');
  });

  it('INVALID_ID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return toolingRequirementIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return toolingRequirementIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
