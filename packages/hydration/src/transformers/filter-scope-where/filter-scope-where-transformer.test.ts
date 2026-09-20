import { filterScopeWhereTransformer } from './filter-scope-where-transformer';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';
import { LinkSpecStub } from '../../contracts/link-spec/link-spec.stub';
import { FieldValuesStub } from '../../contracts/field-values/field-values.stub';

describe('filterScopeWhereTransformer', () => {
  describe('a scope whose ingredient matches one of the links', () => {
    it('VALID: {where, scope guild[0:0]/quest[0:0], links [{of: "quest", as: "questId"}]} => narrows where by the scope’s id', () => {
      const scope = RowRefStub({ value: 'guild[0:0]/quest[0:0]' });
      const records = new Map([[scope, { id: 'q1' }]]);

      const result = filterScopeWhereTransformer({
        where: FieldValuesStub({ role: 'riftcarver' }),
        scope,
        links: [LinkSpecStub({ of: 'quest', as: 'questId' })],
        records,
      });

      expect(result).toStrictEqual({ role: 'riftcarver', questId: 'q1' });
    });

    it('VALID: {a link with a non-default "from"} => reads the scope’s id off that field', () => {
      const scope = RowRefStub({ value: 'session[0:0]' });
      const records = new Map([[scope, { sessionId: 's1' }]]);

      const result = filterScopeWhereTransformer({
        where: FieldValuesStub({}),
        scope,
        links: [LinkSpecStub({ of: 'session', as: 'sessionId', from: 'sessionId' })],
        records,
      });

      expect(result).toStrictEqual({ sessionId: 's1' });
    });
  });

  describe('no scope — D11’s top-level case', () => {
    it('VALID: {no scope} => returns the where unchanged', () => {
      const result = filterScopeWhereTransformer({
        where: FieldValuesStub({ role: 'riftcarver' }),
        links: [LinkSpecStub({ of: 'quest', as: 'questId' })],
        records: new Map(),
      });

      expect(result).toStrictEqual({ role: 'riftcarver' });
    });
  });

  describe('a scope whose ingredient no link names', () => {
    it('EDGE: {scope guild[0:0], links naming only quest} => returns the where unchanged', () => {
      const scope = RowRefStub({ value: 'guild[0:0]' });

      const result = filterScopeWhereTransformer({
        where: FieldValuesStub({ role: 'riftcarver' }),
        scope,
        links: [LinkSpecStub({ of: 'quest', as: 'questId' })],
        records: new Map([[scope, { id: 'g1' }]]),
      });

      expect(result).toStrictEqual({ role: 'riftcarver' });
    });
  });
});
