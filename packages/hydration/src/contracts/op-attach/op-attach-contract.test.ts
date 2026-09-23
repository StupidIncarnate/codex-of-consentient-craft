import { opAttachContract } from './op-attach-contract';
import { OpAttachStub } from './op-attach.stub';

const REQUIRED_FIELDS = ['ingredient', 'ref', 'ancestors', 'where'] as const;

describe('opAttachContract', () => {
  describe('valid attach ops', () => {
    it('VALID: {ingredient: "quest", ref: "quest[0:0]", ancestors: [], where: {id}} => returns the whole op', () => {
      expect(
        OpAttachStub({
          ingredient: 'quest',
          ref: 'quest[0:0]',
          ancestors: [],
          where: { id: '00000000-0000-4000-8000-000000000001' },
        }),
      ).toStrictEqual({
        op: 'attach',
        ingredient: 'quest',
        ref: 'quest[0:0]',
        ancestors: [],
        where: { id: '00000000-0000-4000-8000-000000000001' },
      });
    });

    it('VALID: {ancestors: ["guild[0:0]"]} => a nested attach carries its immediate host', () => {
      expect(
        OpAttachStub({
          ingredient: 'quest',
          ref: 'guild[0:0]/quest[0:0]',
          ancestors: ['guild[0:0]'],
        }),
      ).toStrictEqual({
        op: 'attach',
        ingredient: 'quest',
        ref: 'guild[0:0]/quest[0:0]',
        ancestors: ['guild[0:0]'],
        where: { id: '00000000-0000-4000-8000-000000000001' },
      });
    });
  });

  describe('invalid attach ops', () => {
    it.each(REQUIRED_FIELDS)('INVALID: {no %s} => throws "Required"', (field) => {
      const incomplete: Record<string, unknown> = { ...OpAttachStub() };
      Reflect.deleteProperty(incomplete, field);

      expect(() => opAttachContract.parse(incomplete)).toThrow(/Required/u);
    });

    it('INVALID: {op: "nope"} => throws naming the expected literal', () => {
      expect(() =>
        opAttachContract.parse({
          op: 'nope' as never,
          ingredient: 'quest',
          ref: 'quest[0:0]',
          ancestors: [],
          where: {},
        }),
      ).toThrow(/Invalid literal value/u);
    });
  });
});
