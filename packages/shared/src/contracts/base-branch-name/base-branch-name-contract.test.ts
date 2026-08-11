import { baseBranchNameContract } from './base-branch-name-contract';
import { BaseBranchNameStub } from './base-branch-name.stub';

describe('baseBranchNameContract', () => {
  it('VALID: {value: "main"} => parses successfully', () => {
    const branch = BaseBranchNameStub({ value: 'main' });

    expect(branch).toBe('main');
  });

  it('VALID: {value: "master"} => parses successfully', () => {
    const branch = BaseBranchNameStub({ value: 'master' });

    expect(branch).toBe('master');
  });

  it('INVALID: {value: "develop"} => throws validation error', () => {
    expect(() => {
      return baseBranchNameContract.parse('develop');
    }).toThrow(/Invalid enum value/u);
  });
});
