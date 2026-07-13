import { operationItemIdContract } from './operation-item-id-contract';
import { OperationItemIdStub } from './operation-item-id.stub';

describe('operationItemIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = OperationItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = OperationItemIdStub();

    expect(id).toBe('a1b2c3d4-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return operationItemIdContract.parse('not-a-uuid');
    }).toThrow(/invalid_string/u);
  });

  it('EMPTY: {value: ""} => throws validation error', () => {
    expect(() => {
      return operationItemIdContract.parse('');
    }).toThrow(/invalid_string/u);
  });
});
