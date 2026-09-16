import { leftAloneContract } from './left-alone-contract';
import { LeftAloneStub } from './left-alone.stub';

describe('leftAloneContract', () => {
  describe('valid rows', () => {
    it('VALID: {why: "live — last beat 2s ago"} => parses spec line 1361 verbatim', () => {
      const leftAlone = LeftAloneStub({ id: 'inst_7f3a', why: 'live — last beat 2s ago' });

      const result = leftAloneContract.parse(leftAlone);

      expect(result).toStrictEqual({ id: 'inst_7f3a', why: 'live — last beat 2s ago' });
    });

    it('VALID: {why: "reserved — booting, no beat yet"} => the unbeaten-reservation protection is visible here', () => {
      const leftAlone = LeftAloneStub({
        id: 'inst_1d09',
        why: 'reserved — booting, no beat yet',
      });

      const result = leftAloneContract.parse(leftAlone);

      expect(result).toStrictEqual({ id: 'inst_1d09', why: 'reserved — booting, no beat yet' });
    });
  });

  describe('invalid rows', () => {
    it('INVALID: {missing why} => throws Required', () => {
      expect(() => leftAloneContract.parse({ id: 'inst_7f3a' })).toThrow(/Required/u);
    });
  });
});
