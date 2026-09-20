import { planSavedNamesTransformer } from './plan-saved-names-transformer';
import { HydrationPlanStub } from '../../contracts/hydration-plan/hydration-plan.stub';
import { OpCreateStub } from '../../contracts/op-create/op-create.stub';
import { OpSaveRecordStub } from '../../contracts/op-save-record/op-save-record.stub';
import { OpFilterStub } from '../../contracts/op-filter/op-filter.stub';
import { OpRemoveStub } from '../../contracts/op-remove/op-remove.stub';

describe('planSavedNamesTransformer', () => {
  describe('a plan saving two records at the top level', () => {
    it('VALID: {a plan saving guild then third} => returns [guild, third]', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ref: 'guild[0:0]' }),
          OpSaveRecordStub({ ref: 'guild[0:0]', name: 'guild' }),
          OpCreateStub({ ref: 'guild[0:0]/quest[0:2]' }),
          OpSaveRecordStub({ ref: 'guild[0:0]/quest[0:2]', name: 'third' }),
        ],
      });

      const result = planSavedNamesTransformer({ plan });

      expect(result).toStrictEqual(['guild', 'third']);
    });
  });

  describe('a plan saving a record nested inside a filter', () => {
    it("VALID: {a plan saving inside a filter's nested ops} => includes that name", () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ref: 'guild[0:0]/quest[0:0]' }),
          OpFilterStub({
            ingredient: 'operation',
            scope: 'guild[0:0]/quest[0:0]',
            matchedRef: 'operation[match]',
            ops: [OpSaveRecordStub({ ref: 'operation[match]', name: 'firstOperation' })],
          }),
        ],
      });

      const result = planSavedNamesTransformer({ plan });

      expect(result).toStrictEqual(['firstOperation']);
    });
  });

  describe('a plan saving nothing', () => {
    it('VALID: {a plan saving nothing} => returns []', () => {
      const plan = HydrationPlanStub({
        ops: [OpCreateStub({ ref: 'guild[0:0]' }), OpRemoveStub({ ref: 'guild[0:0]' })],
      });

      const result = planSavedNamesTransformer({ plan });

      expect(result).toStrictEqual([]);
    });
  });
});
