import { SmoketestEnsureGuildResultStub } from './smoketest-ensure-guild-result.stub';
import { smoketestEnsureGuildResultContract } from './smoketest-ensure-guild-result-contract';

describe('smoketestEnsureGuildResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = SmoketestEnsureGuildResultStub();

      expect(smoketestEnsureGuildResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {guildId: wrong type} => throws', () => {
      expect(() =>
        smoketestEnsureGuildResultContract.parse({
          ...SmoketestEnsureGuildResultStub(),
          guildId: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
