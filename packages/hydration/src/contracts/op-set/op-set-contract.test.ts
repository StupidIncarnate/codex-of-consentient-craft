import { opSetContract } from './op-set-contract';
import { OpSetStub } from './op-set.stub';

const REQUIRED_FIELDS = ['ref', 'written'] as const;

describe('opSetContract', () => {
  describe('valid set ops', () => {
    it('VALID: {ref, written: {title}} => returns the op with no transition key', () => {
      expect(
        OpSetStub({ ref: 'guild[0]/quest[2]', written: { title: 'The running one' } }),
      ).toStrictEqual({
        op: 'set',
        ref: 'guild[0]/quest[2]',
        written: { title: 'The running one' },
      });
    });

    it('VALID: {ref, written: {}, transition: {field: "status", to: "in_progress"}} => returns both halves', () => {
      expect(
        OpSetStub({
          ref: 'guild[0]/quest[2]',
          written: {},
          transition: { field: 'status', to: 'in_progress' },
        }),
      ).toStrictEqual({
        op: 'set',
        ref: 'guild[0]/quest[2]',
        written: {},
        transition: { field: 'status', to: 'in_progress' },
      });
    });
  });

  describe('invalid set ops', () => {
    it.each(REQUIRED_FIELDS)('INVALID: {no %s} => throws "Required"', (field) => {
      const incomplete: Record<string, unknown> = { ...OpSetStub() };
      Reflect.deleteProperty(incomplete, field);

      expect(() => opSetContract.parse(incomplete)).toThrow(/Required/u);
    });

    it('INVALID: {op: "nope"} => throws naming the expected literal', () => {
      expect(() =>
        opSetContract.parse({
          op: 'nope' as never,
          ref: 'guild[0]/quest[2]',
          written: {},
        }),
      ).toThrow(/Invalid literal value/u);
    });
  });
});
