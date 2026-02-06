import { designDecisionIdContract } from './design-decision-id-contract';
import { DesignDecisionIdStub } from './design-decision-id.stub';

describe('designDecisionIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = DesignDecisionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = DesignDecisionIdStub();

    expect(id).toBe('c23bc10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID_ID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return designDecisionIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return designDecisionIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
