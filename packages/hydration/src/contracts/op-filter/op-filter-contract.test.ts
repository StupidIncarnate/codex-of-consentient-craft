import { opFilterContract } from './op-filter-contract';
import { OpFilterStub } from './op-filter.stub';
import { OpRemoveStub } from '../op-remove/op-remove.stub';

const REQUIRED_FIELDS = ['ingredient', 'where', 'expect', 'matchedRef', 'ops'] as const;

describe('opFilterContract', () => {
  describe('valid filter ops', () => {
    it('VALID: {top-level, no scope} => returns the op with no scope key', () => {
      expect(
        OpFilterStub({
          ingredient: 'operation',
          where: { role: 'riftcarver' },
          expect: 'one',
          matchedRef: 'operation[0]',
          ops: [OpRemoveStub({ ref: 'operation[0]' })],
        }),
      ).toStrictEqual({
        op: 'filter',
        ingredient: 'operation',
        where: { role: 'riftcarver' },
        expect: 'one',
        matchedRef: 'operation[0]',
        ops: [{ op: 'remove', ref: 'operation[0]' }],
      });
    });

    it('VALID: {scope: "guild[0]/quest[0]"} => returns the scoped op', () => {
      expect(OpFilterStub({ scope: 'guild[0]/quest[0]', ingredient: 'operation' })).toStrictEqual({
        op: 'filter',
        ingredient: 'operation',
        scope: 'guild[0]/quest[0]',
        where: { role: 'riftcarver' },
        expect: 'one',
        matchedRef: 'operation[0]',
        ops: [],
      });
    });

    it('VALID: {ops: [a nested filter]} => a filter may nest another filter', () => {
      const nested = OpFilterStub({ ingredient: 'workItem', matchedRef: 'workItem[0]', ops: [] });

      expect(OpFilterStub({ ops: [nested] })).toStrictEqual({
        op: 'filter',
        ingredient: 'operation',
        where: { role: 'riftcarver' },
        expect: 'one',
        matchedRef: 'operation[0]',
        ops: [
          {
            op: 'filter',
            ingredient: 'workItem',
            where: { role: 'riftcarver' },
            expect: 'one',
            matchedRef: 'workItem[0]',
            ops: [],
          },
        ],
      });
    });
  });

  describe('invalid filter ops', () => {
    it.each(REQUIRED_FIELDS)('INVALID: {no %s} => throws "Required"', (field) => {
      const incomplete: Record<string, unknown> = { ...OpFilterStub() };
      Reflect.deleteProperty(incomplete, field);

      expect(() => opFilterContract.parse(incomplete)).toThrow(/Required/u);
    });

    it('INVALID: {ops: [a malformed nested op]} => throws naming every branch it failed', () => {
      expect(() =>
        opFilterContract.parse({
          op: 'filter',
          ingredient: 'operation',
          where: {},
          expect: 'one',
          matchedRef: 'operation[0]',
          ops: [{ op: 'nope' }],
        }),
      ).toThrow(/invalid_union/u);
    });

    it('INVALID: {op: "nope"} => throws naming the expected literal', () => {
      expect(() =>
        opFilterContract.parse({
          op: 'nope' as never,
          ingredient: 'operation',
          where: {},
          expect: 'one',
          matchedRef: 'operation[0]',
          ops: [],
        }),
      ).toThrow(/Invalid literal value/u);
    });
  });
});
