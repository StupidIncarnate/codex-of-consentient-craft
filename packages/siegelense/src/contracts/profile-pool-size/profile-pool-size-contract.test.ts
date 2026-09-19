import { profilePoolSizeContract } from './profile-pool-size-contract';
import { ProfilePoolSizeStub } from './profile-pool-size.stub';

describe('profilePoolSizeContract', () => {
  describe('valid pool sizes', () => {
    it('VALID: {value: 1} => returns 1', () => {
      expect(profilePoolSizeContract.parse(ProfilePoolSizeStub({ value: 1 }))).toBe(1);
    });

    it('VALID: {value: 3} => returns 3', () => {
      expect(profilePoolSizeContract.parse(ProfilePoolSizeStub({ value: 3 }))).toBe(3);
    });

    it('VALID: {no argument} => defaults to a solo pool of 1', () => {
      expect(ProfilePoolSizeStub()).toBe(1);
    });
  });

  describe('invalid pool sizes', () => {
    it('INVALID: {value: 0} => throws, because the beating instance is itself in the pool', () => {
      expect(() => {
        profilePoolSizeContract.parse(0);
      }).toThrow(/greater than 0/u);
    });

    it('INVALID: {value: -1} => throws', () => {
      expect(() => {
        profilePoolSizeContract.parse(-1);
      }).toThrow(/greater than 0/u);
    });

    it('INVALID: {value: 1.5} => throws, a pool holds whole instances', () => {
      expect(() => {
        profilePoolSizeContract.parse(1.5);
      }).toThrow(/integer/u);
    });
  });
});
