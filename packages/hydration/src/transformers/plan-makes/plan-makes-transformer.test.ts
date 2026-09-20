import { planMakesTransformer } from './plan-makes-transformer';
import { HydrationPlanStub } from '../../contracts/hydration-plan/hydration-plan.stub';
import { OpCreateStub } from '../../contracts/op-create/op-create.stub';
import { OpSetStub } from '../../contracts/op-set/op-set.stub';
import { OpFilterStub } from '../../contracts/op-filter/op-filter.stub';
import { OpRemoveStub } from '../../contracts/op-remove/op-remove.stub';

describe('planMakesTransformer', () => {
  describe('a plan holding only create ops', () => {
    it('VALID: {one guild, three quests} => returns an exact count per ingredient, in declaration order', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:0]',
            index: 0,
            ancestors: ['guild[0:0]'],
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:1]',
            index: 1,
            ancestors: ['guild[0:0]'],
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:2]',
            index: 2,
            ancestors: ['guild[0:0]'],
          }),
        ],
      });

      const result = planMakesTransformer({ plan });

      expect(result).toStrictEqual([
        { ingredient: 'guild', count: 1 },
        { ingredient: 'quest', count: 3 },
      ]);
    });
  });

  describe('a plan holding a filter, with no transition anywhere', () => {
    it('VALID: {one quest, a filter over its operations} => the filtered ingredient reports varies', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpFilterStub({
            ingredient: 'operation',
            scope: 'quest[0:0]',
            matchedRef: 'operation[match]',
            ops: [OpRemoveStub({ ref: 'operation[match]' })],
          }),
        ],
      });

      const result = planMakesTransformer({ plan });

      expect(result).toStrictEqual([
        { ingredient: 'quest', count: 1 },
        { ingredient: 'operation', count: 'varies' },
      ]);
    });
  });

  describe('a plan holding a transition, with no filter anywhere', () => {
    it('VALID: {three quests, one transitioned} => the transitioned ingredient keeps its exact create count', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:0]',
            index: 0,
            ancestors: ['guild[0:0]'],
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:1]',
            index: 1,
            ancestors: ['guild[0:0]'],
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:2]',
            index: 2,
            ancestors: ['guild[0:0]'],
          }),
          OpSetStub({
            ref: 'guild[0:0]/quest[0:0]',
            written: {},
            transition: { field: 'status', to: 'in_progress' },
          }),
        ],
      });

      const result = planMakesTransformer({ plan });

      expect(result).toStrictEqual([{ ingredient: 'quest', count: 3 }]);
    });
  });

  // The specification's own worked example: a transition mints operation rows, and the ONLY way
  // the plan can see them is the filter that later reaches into that transitioned row. Together
  // they are why `operation` prints `varies` while `quest`, transitioned or not, keeps its exact
  // create count.
  describe('a transition and a filter together, reproducing the specification`s own example', () => {
    it('VALID: {guild ×1, quest ×3, quest[0] transitioned, a filter removes quest[0]`s operations} => guild ×1, quest ×3, operation varies', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:0]',
            index: 0,
            ancestors: ['guild[0:0]'],
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:1]',
            index: 1,
            ancestors: ['guild[0:0]'],
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:2]',
            index: 2,
            ancestors: ['guild[0:0]'],
          }),
          OpSetStub({
            ref: 'guild[0:0]/quest[0:0]',
            written: { title: 'The running one' },
            transition: { field: 'status', to: 'in_progress' },
          }),
          OpFilterStub({
            ingredient: 'operation',
            scope: 'guild[0:0]/quest[0:0]',
            where: { role: 'riftcarver' },
            expect: 'one',
            matchedRef: 'guild[0:0]/quest[0:0]/operation[match]',
            ops: [OpRemoveStub({ ref: 'guild[0:0]/quest[0:0]/operation[match]' })],
          }),
        ],
      });

      const result = planMakesTransformer({ plan });

      expect(result).toStrictEqual([
        { ingredient: 'guild', count: 1 },
        { ingredient: 'quest', count: 3 },
        { ingredient: 'operation', count: 'varies' },
      ]);
    });
  });

  describe('a filter reaching an ingredient the plan already created', () => {
    it('VALID: {three quests created, then a filter also targets quest} => quest flips from an exact count to varies, keeping its original position', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:1]', index: 1, ancestors: [] }),
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
          OpFilterStub({
            ingredient: 'quest',
            where: { status: 'complete' },
            matchedRef: 'quest[match]',
            ops: [],
          }),
        ],
      });

      const result = planMakesTransformer({ plan });

      expect(result).toStrictEqual([
        { ingredient: 'quest', count: 'varies' },
        { ingredient: 'guild', count: 1 },
      ]);
    });
  });
});
