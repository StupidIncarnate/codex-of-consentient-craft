import { DungeonmasterHomeEnsureResultStub } from './dungeonmaster-home-ensure-result.stub';
import { dungeonmasterHomeEnsureResultContract } from './dungeonmaster-home-ensure-result-contract';

describe('dungeonmasterHomeEnsureResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = DungeonmasterHomeEnsureResultStub();

      expect(dungeonmasterHomeEnsureResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {homePath: wrong type} => throws', () => {
      expect(() =>
        dungeonmasterHomeEnsureResultContract.parse({
          ...DungeonmasterHomeEnsureResultStub(),
          homePath: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
