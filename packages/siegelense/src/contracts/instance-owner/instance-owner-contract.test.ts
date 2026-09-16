import { instanceOwnerContract } from './instance-owner-contract';
import { InstanceOwnerStub } from './instance-owner.stub';

describe('instanceOwnerContract', () => {
  it('VALID: {value: "42781"} => parses successfully', () => {
    const instanceOwner = InstanceOwnerStub({ value: '42781' });

    const result = instanceOwnerContract.parse(instanceOwner);

    expect(result).toBe('42781');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      instanceOwnerContract.parse('');
    }).toThrow(/String must contain at least 1 character/u);
  });

  it('EDGE: {value: "1"} => a single-character owner id parses successfully', () => {
    const result = instanceOwnerContract.parse('1');

    expect(result).toBe('1');
  });
});
