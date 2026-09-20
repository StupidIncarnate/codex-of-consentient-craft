import { matchesWhereClauseGuard } from './matches-where-clause-guard';

describe('matchesWhereClauseGuard', () => {
  describe('a matching record', () => {
    it('VALID: {record, where: one matching key} => returns true', () => {
      const result = matchesWhereClauseGuard({
        record: { role: 'ward', status: 'pending' },
        where: { role: 'ward' },
      });

      expect(result).toBe(true);
    });

    it('VALID: {record, where: {}} => returns true, matching every row', () => {
      const result = matchesWhereClauseGuard({
        record: { role: 'ward', status: 'pending' },
        where: {},
      });

      expect(result).toBe(true);
    });
  });

  describe('a non-matching record', () => {
    it('INVALID: {record, where: one mismatched key} => returns false', () => {
      const result = matchesWhereClauseGuard({
        record: { role: 'ward', status: 'pending' },
        where: { role: 'codeweaver' },
      });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {record: undefined} => returns false', () => {
      const result = matchesWhereClauseGuard({ where: { role: 'ward' } });

      expect(result).toBe(false);
    });

    it('EMPTY: {where: undefined} => returns true, matching every row', () => {
      const result = matchesWhereClauseGuard({ record: { role: 'ward' } });

      expect(result).toBe(true);
    });

    it('EMPTY: {} => returns false', () => {
      const result = matchesWhereClauseGuard({});

      expect(result).toBe(false);
    });
  });
});
