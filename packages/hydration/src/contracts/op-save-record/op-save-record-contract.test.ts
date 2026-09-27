import { opSaveRecordContract } from './op-save-record-contract';
import { OpSaveRecordStub } from './op-save-record.stub';

const REQUIRED_FIELDS = ['ref', 'name'] as const;

describe('opSaveRecordContract', () => {
  describe('valid saveRecord ops', () => {
    it('VALID: {ref: "guild[0:0]/quest[0:2]", name: "third"} => returns the whole op', () => {
      expect(OpSaveRecordStub({ ref: 'guild[0:0]/quest[0:2]', name: 'third' })).toStrictEqual({
        op: 'saveRecord',
        ref: 'guild[0:0]/quest[0:2]',
        name: 'third',
      });
    });
  });

  describe('invalid saveRecord ops', () => {
    it.each(REQUIRED_FIELDS)('INVALID: {no %s} => throws "received undefined"', (field) => {
      const incomplete: Record<string, unknown> = { ...OpSaveRecordStub() };
      Reflect.deleteProperty(incomplete, field);

      expect(() => opSaveRecordContract.parse(incomplete)).toThrow(/received undefined/u);
    });

    it('INVALID: {op: "nope"} => throws naming the expected literal', () => {
      expect(() =>
        opSaveRecordContract.parse({
          op: 'nope' as never,
          ref: 'guild[0:0]/quest[0:2]',
          name: 'third',
        }),
      ).toThrow(/Invalid input: expected/u);
    });
  });
});
