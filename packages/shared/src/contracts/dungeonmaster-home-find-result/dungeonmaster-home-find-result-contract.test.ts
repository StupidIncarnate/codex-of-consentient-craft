import { DungeonmasterHomeFindResultStub } from './dungeonmaster-home-find-result.stub';
import { dungeonmasterHomeFindResultContract } from './dungeonmaster-home-find-result-contract';

describe('dungeonmasterHomeFindResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = DungeonmasterHomeFindResultStub();

      expect(dungeonmasterHomeFindResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {homePath: wrong type} => throws', () => {
      expect(() =>
        dungeonmasterHomeFindResultContract.parse({
          ...DungeonmasterHomeFindResultStub(),
          homePath: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
