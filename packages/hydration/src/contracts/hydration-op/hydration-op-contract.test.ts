import { hydrationOpContract } from './hydration-op-contract';
import { HydrationOpStub } from './hydration-op.stub';
import { OpCreateStub } from '../op-create/op-create.stub';
import { OpSetStub } from '../op-set/op-set.stub';
import { OpRemoveStub } from '../op-remove/op-remove.stub';
import { OpSaveRecordStub } from '../op-save-record/op-save-record.stub';
import { OpExtraStub } from '../op-extra/op-extra.stub';
import { OpFilterStub } from '../op-filter/op-filter.stub';

// One stub per member of the six-kind union, in the SAME order `hydrationOpContract` declares its
// branches — the round-trip below parses each branch against its own stub, so a seventh branch
// with no matching stub here fails the array-length comparison instead of passing silently.
const OP_STUBS = [
  OpCreateStub,
  OpSetStub,
  OpRemoveStub,
  OpSaveRecordStub,
  OpExtraStub,
  OpFilterStub,
] as const;

describe('hydrationOpContract', () => {
  it("VALID: {} => the union's branches parse their own stub, in declaration order", () => {
    const results = hydrationOpContract.options.map((option, index) =>
      option.parse(OP_STUBS[index]?.()),
    );

    expect(results).toStrictEqual(OP_STUBS.map((Stub) => Stub()));
  });

  describe.each(OP_STUBS)('op kind: %#', (Stub) => {
    it('VALID: {op} => round-trips through the union', () => {
      const op = Stub();

      expect(hydrationOpContract.parse(op)).toStrictEqual(op);
    });
  });

  describe('the default stub', () => {
    it('VALID: {default} => creates a create op', () => {
      const result = HydrationOpStub();

      expect(result).toStrictEqual(OpCreateStub());
    });

    it('VALID: {op: "remove"} => creates a remove op', () => {
      const result = HydrationOpStub({ op: 'remove', ref: 'guild[0]/quest[1]' });

      expect(result).toStrictEqual(OpRemoveStub({ ref: 'guild[0]/quest[1]' }));
    });
  });

  describe('an unknown discriminant', () => {
    it('INVALID: {op: "nope"} => throws invalid_union, naming every branch it failed', () => {
      expect(() => hydrationOpContract.parse({ op: 'nope' })).toThrow(/invalid_union/u);
    });
  });
});
