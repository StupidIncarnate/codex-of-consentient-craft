import { operationPlanIdContract } from './operation-plan-id-contract';
import { OperationPlanIdStub } from './operation-plan-id.stub';

describe('operationPlanIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = OperationPlanIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = OperationPlanIdStub();

    expect(id).toBe('c3d4e5f6-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return operationPlanIdContract.parse('not-a-uuid');
    }).toThrow(/invalid_string/u);
  });

  it('EMPTY: {value: ""} => throws validation error', () => {
    expect(() => {
      return operationPlanIdContract.parse('');
    }).toThrow(/invalid_string/u);
  });
});
