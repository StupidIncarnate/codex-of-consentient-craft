import { operationPlanPieceIdContract } from './operation-plan-piece-id-contract';
import { OperationPlanPieceIdStub } from './operation-plan-piece-id.stub';

describe('operationPlanPieceIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = OperationPlanPieceIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = OperationPlanPieceIdStub();

    expect(id).toBe('b2c3d4e5-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return operationPlanPieceIdContract.parse('not-a-uuid');
    }).toThrow(/invalid_string/u);
  });

  it('EMPTY: {value: ""} => throws validation error', () => {
    expect(() => {
      return operationPlanPieceIdContract.parse('');
    }).toThrow(/invalid_string/u);
  });
});
