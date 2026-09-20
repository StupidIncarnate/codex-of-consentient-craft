import { resultWhereContract } from './result-where-contract';
import { ResultWhereStub } from './result-where.stub';

describe('resultWhereContract', () => {
  describe('valid clauses', () => {
    it('VALID: {every member null} => parses a clause naming nothing', () => {
      const where = ResultWhereStub();

      const result = resultWhereContract.parse(where);

      expect(result).toStrictEqual({
        path: null,
        method: null,
        nth: null,
        level: null,
        steps: null,
      });
    });

    it('VALID: {path, method set} => parses a network narrowing clause', () => {
      const where = ResultWhereStub({ path: '/api/quests', method: 'POST' });

      const result = resultWhereContract.parse(where);

      expect(result).toStrictEqual({
        path: '/api/quests',
        method: 'POST',
        nth: null,
        level: null,
        steps: null,
      });
    });

    it('VALID: {level, steps set} => parses a server narrowing clause', () => {
      const where = ResultWhereStub({ level: 'error', steps: '4-9' });

      const result = resultWhereContract.parse(where);

      expect(result).toStrictEqual({
        path: null,
        method: null,
        nth: null,
        level: 'error',
        steps: '4-9',
      });
    });
  });

  describe('rejecting an unknown clause', () => {
    it('INVALID: {serverError: true} => throws naming the stray key', () => {
      expect(() =>
        resultWhereContract.parse({
          path: null,
          method: null,
          nth: null,
          level: null,
          steps: null,
          serverError: true,
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'serverError'/u);
    });
  });
});
