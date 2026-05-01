import { getProjectInventoryInputContract } from './get-project-inventory-input-contract';
import { GetProjectInventoryInputStub } from './get-project-inventory-input.stub';

describe('getProjectInventoryInputContract', () => {
  it('VALID: {packageName: "web"} => parses successfully', () => {
    const result = GetProjectInventoryInputStub({ packageName: 'web' });

    expect(result).toStrictEqual({ packageName: 'web' });
  });

  it('VALID: {packageName: "shared"} => parses successfully', () => {
    const result = GetProjectInventoryInputStub({ packageName: 'shared' });

    expect(result).toStrictEqual({ packageName: 'shared' });
  });

  it('INVALID: {packageName: ""} => throws min-length error', () => {
    expect(() => {
      getProjectInventoryInputContract.parse({ packageName: '' });
    }).toThrow(/at least 1 character/u);
  });

  it('INVALID: {packageName, extra} => throws Unrecognized key error', () => {
    expect(() => {
      getProjectInventoryInputContract.parse({ packageName: 'web', extra: 'no' } as never);
    }).toThrow(/Unrecognized key/u);
  });
});
