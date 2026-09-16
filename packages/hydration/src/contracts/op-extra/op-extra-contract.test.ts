import { opExtraContract } from './op-extra-contract';
import { OpExtraStub } from './op-extra.stub';

const REQUIRED_FIELDS = ['ref', 'verb', 'args'] as const;

describe('opExtraContract', () => {
  describe('valid extra ops', () => {
    it('VALID: {ref: "session[0:0]", verb: "withNestedChain", args: {depth: 2}} => returns the whole op', () => {
      expect(
        OpExtraStub({ ref: 'session[0:0]', verb: 'withNestedChain', args: { depth: 2 } }),
      ).toStrictEqual({
        op: 'extra',
        ref: 'session[0:0]',
        verb: 'withNestedChain',
        args: { depth: 2 },
      });
    });

    it('VALID: {args: {}} => an extra with no declared args is legal', () => {
      expect(OpExtraStub({ args: {} })).toStrictEqual({
        op: 'extra',
        ref: 'session[0:0]',
        verb: 'withNestedChain',
        args: {},
      });
    });
  });

  describe('invalid extra ops', () => {
    it.each(REQUIRED_FIELDS)('INVALID: {no %s} => throws "Required"', (field) => {
      const incomplete: Record<string, unknown> = { ...OpExtraStub() };
      Reflect.deleteProperty(incomplete, field);

      expect(() => opExtraContract.parse(incomplete)).toThrow(/Required/u);
    });

    it('INVALID: {verb: "set"} => throws naming the reserved verb', () => {
      expect(() =>
        opExtraContract.parse({ op: 'extra', ref: 'session[0:0]', verb: 'set', args: {} }),
      ).toThrow(/reserved verb/u);
    });

    it('INVALID: {op: "nope"} => throws naming the expected literal', () => {
      expect(() =>
        opExtraContract.parse({
          op: 'nope' as never,
          ref: 'session[0:0]',
          verb: 'withNestedChain',
          args: {},
        }),
      ).toThrow(/Invalid literal value/u);
    });
  });
});
