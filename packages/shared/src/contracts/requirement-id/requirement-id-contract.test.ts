import { requirementIdContract } from './requirement-id-contract';
import { RequirementIdStub } from './requirement-id.stub';

describe('requirementIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = RequirementIdStub();

    expect(id).toBe('b12ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID_ID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return requirementIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return requirementIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
