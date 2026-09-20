import { opCreateContract } from './op-create-contract';
import { OpCreateStub } from './op-create.stub';

const REQUIRED_FIELDS = ['ingredient', 'ref', 'index', 'ancestors', 'fields'] as const;

describe('opCreateContract', () => {
  describe('valid create ops', () => {
    it('VALID: {ingredient: "quest", ref: "guild[0:0]/quest[0:2]", index: 2, ancestors: ["guild[0:0]"], fields: {title: "The running one"}} => returns the whole op', () => {
      expect(
        OpCreateStub({
          ingredient: 'quest',
          ref: 'guild[0:0]/quest[0:2]',
          index: 2,
          ancestors: ['guild[0:0]'],
          fields: { title: 'The running one' },
        }),
      ).toStrictEqual({
        op: 'create',
        ingredient: 'quest',
        ref: 'guild[0:0]/quest[0:2]',
        index: 2,
        ancestors: ['guild[0:0]'],
        fields: { title: 'The running one' },
      });
    });

    it('VALID: {ancestors: []} => a top-level row has no ancestors', () => {
      expect(
        OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
      ).toStrictEqual({
        op: 'create',
        ingredient: 'guild',
        ref: 'guild[0:0]',
        index: 0,
        ancestors: [],
        fields: { title: 'The running one' },
      });
    });
  });

  describe('invalid create ops', () => {
    it.each(REQUIRED_FIELDS)('INVALID: {no %s} => throws "Required"', (field) => {
      const incomplete: Record<string, unknown> = { ...OpCreateStub() };
      Reflect.deleteProperty(incomplete, field);

      expect(() => opCreateContract.parse(incomplete)).toThrow(/Required/u);
    });

    it('INVALID: {op: "nope"} => throws naming the expected literal', () => {
      expect(() =>
        opCreateContract.parse({
          op: 'nope' as never,
          ingredient: 'quest',
          ref: 'guild[0:0]/quest[0:2]',
          index: 2,
          ancestors: ['guild[0:0]'],
          fields: {},
        }),
      ).toThrow(/Invalid literal value/u);
    });
  });
});
