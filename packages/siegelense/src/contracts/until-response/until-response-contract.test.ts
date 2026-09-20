import { untilResponseContract } from './until-response-contract';
import { UntilResponseStub } from './until-response.stub';

describe('untilResponseContract', () => {
  describe('valid input', () => {
    it('VALID: {method: "POST", path: "/api/quests"} => parses to itself', () => {
      const result = untilResponseContract.parse({ method: 'POST', path: '/api/quests' });

      expect(result).toStrictEqual({ method: 'POST', path: '/api/quests' });
    });
  });

  describe('stub', () => {
    it('VALID: {default} => builds a POST /api/quests exchange', () => {
      const result = UntilResponseStub();

      expect(result).toStrictEqual({ method: 'POST', path: '/api/quests' });
    });

    it('VALID: {method override} => keeps the overridden method and the default path', () => {
      const result = UntilResponseStub({ method: 'GET' });

      expect(result).toStrictEqual({ method: 'GET', path: '/api/quests' });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {method: "post"} => throws for a lower-cased method', () => {
      expect(() => untilResponseContract.parse({ method: 'post', path: '/api/quests' })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {+extra key} => throws naming the stray key', () => {
      expect(() =>
        untilResponseContract.parse({ method: 'POST', path: '/api/quests', extra: 'x' } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'extra'/u);
    });

    it('INVALID: {missing path} => throws for the missing field', () => {
      expect(() => untilResponseContract.parse({ method: 'POST' } as never)).toThrow(/Required/u);
    });
  });
});
