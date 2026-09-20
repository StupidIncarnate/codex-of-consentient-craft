import { profileBootContract } from './profile-boot-contract';
import { ProfileBootStub } from './profile-boot.stub';

describe('profileBootContract', () => {
  describe('valid boot records', () => {
    it('VALID: {a measured 20s boot} => parses to the complete record', () => {
      const boot = ProfileBootStub({
        instanceId: 'inst_7f3a9c21',
        specHash: 'a3f9c2e1',
        bootMs: 20_000,
        recordedAtMs: 1_700_000_000_000,
      });

      expect(profileBootContract.parse(boot)).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        specHash: 'a3f9c2e1',
        bootMs: 20_000,
        recordedAtMs: 1_700_000_000_000,
      });
    });

    it('EDGE: {bootMs: 0} => a boot that answered instantly parses', () => {
      expect(profileBootContract.parse(ProfileBootStub({ bootMs: 0 })).bootMs).toBe(0);
    });
  });

  describe('invalid boot records', () => {
    it('INVALID: {bootMs: -1} => throws', () => {
      expect(() => {
        profileBootContract.parse({
          instanceId: 'inst_7f3a9c21',
          specHash: 'a3f9c2e1',
          bootMs: -1,
          recordedAtMs: 1_700_000_000_000,
        });
      }).toThrow(/greater than or equal to 0/u);
    });

    it('INVALID: {no bootMs} => throws', () => {
      expect(() => {
        profileBootContract.parse({
          instanceId: 'inst_7f3a9c21',
          specHash: 'a3f9c2e1',
          recordedAtMs: 1_700_000_000_000,
        });
      }).toThrow(/Required/u);
    });
  });
});
