import { profileArgsContract } from './profile-args-contract';
import { ProfileArgsStub } from './profile-args.stub';

describe('profileArgsContract', () => {
  describe('default isJson', () => {
    it('VALID: {specName} => defaults isJson to false', () => {
      const result = profileArgsContract.parse(ProfileArgsStub({ specName: 'dungeonmaster-api' }));

      expect(result).toStrictEqual({ specName: 'dungeonmaster-api', isJson: false });
    });
  });

  describe('explicit isJson', () => {
    it('VALID: {specName, isJson: true} => preserves isJson true', () => {
      const result = profileArgsContract.parse(
        ProfileArgsStub({ specName: 'dungeonmaster-stack', isJson: true }),
      );

      expect(result).toStrictEqual({ specName: 'dungeonmaster-stack', isJson: true });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {an extra key} => throws, the contract is strict', () => {
      expect(() => ProfileArgsStub({ extra: 'bogus' } as never)).toThrow(/unrecognized key/iu);
    });
  });
});
