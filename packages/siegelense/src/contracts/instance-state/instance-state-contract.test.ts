import { instanceStateContract } from './instance-state-contract';
import { InstanceStateStub } from './instance-state.stub';

describe('instanceStateContract', () => {
  describe('valid members', () => {
    it.each(instanceStateContract.unwrap().options)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const instanceState = InstanceStateStub({ value });

        const result = instanceStateContract.parse(instanceState);

        expect(result).toBe(value);
      },
    );
  });

  describe('invalid members', () => {
    it('INVALID: {value: "starting"} => an unlisted string throws validation error', () => {
      expect(() => {
        InstanceStateStub({ value: 'starting' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "ALIVE"} => an uppercase variant of a valid member throws validation error', () => {
      expect(() => {
        instanceStateContract.parse('ALIVE');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
