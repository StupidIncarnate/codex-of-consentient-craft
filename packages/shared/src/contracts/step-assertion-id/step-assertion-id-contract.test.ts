import { stepAssertionIdContract } from './step-assertion-id-contract';
import { StepAssertionIdStub } from './step-assertion-id.stub';

describe('stepAssertionIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = StepAssertionIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });

    expect(id).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = StepAssertionIdStub();

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return stepAssertionIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return stepAssertionIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
