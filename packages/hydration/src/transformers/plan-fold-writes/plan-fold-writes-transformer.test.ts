import { planFoldWritesTransformer } from './plan-fold-writes-transformer';
import { collectionChainTransformer } from '../collection-chain/collection-chain-transformer';
import { questIngredient, questFieldsContract } from '../../../test/type-fixtures/dm-target';
import { HydrationPlanStub } from '../../contracts/hydration-plan/hydration-plan.stub';
import { OpCreateStub } from '../../contracts/op-create/op-create.stub';
import { OpSetStub } from '../../contracts/op-set/op-set.stub';
import { OpRemoveStub } from '../../contracts/op-remove/op-remove.stub';
import { OpSaveRecordStub } from '../../contracts/op-save-record/op-save-record.stub';
import { SavedRefStub } from '../../contracts/saved-ref/saved-ref.stub';
import type { IngredientConfigStub } from '../../contracts/ingredient-config/ingredient-config.stub';
import type { HydrationOpStub } from '../../contracts/hydration-op/hydration-op.stub';

type IngredientConfigData = ReturnType<typeof IngredientConfigStub>;
type HydrationOp = ReturnType<typeof HydrationOpStub>;

describe('planFoldWritesTransformer', () => {
  describe('one plain field, one set op', () => {
    it('VALID: {create quest[0:0], set {title: "first"}} => one create carrying title and no set op', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ref: 'guild[0:0]/quest[0:0]', ancestors: ['guild[0:0]'], fields: {} }),
          OpSetStub({ ref: 'guild[0:0]/quest[0:0]', written: { title: 'first' } }),
        ],
      });

      const result = planFoldWritesTransformer({ plan });

      expect(result).toStrictEqual(
        HydrationPlanStub({
          ops: [
            OpCreateStub({
              ref: 'guild[0:0]/quest[0:0]',
              ancestors: ['guild[0:0]'],
              fields: { title: 'first' },
            }),
          ],
        }),
      );
    });
  });

  describe('an all() set folded across three rows, plus one row-specific set', () => {
    it('VALID: {all.set(userRequest) then q[0].set(title)} => create[0] carries both, create[1] and create[2] carry only userRequest', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ref: 'guild[0:0]/quest[0:0]',
            ancestors: ['guild[0:0]'],
            index: 0,
            fields: {},
          }),
          OpCreateStub({
            ref: 'guild[0:0]/quest[0:1]',
            ancestors: ['guild[0:0]'],
            index: 1,
            fields: {},
          }),
          OpCreateStub({
            ref: 'guild[0:0]/quest[0:2]',
            ancestors: ['guild[0:0]'],
            index: 2,
            fields: {},
          }),
          OpSetStub({ ref: 'guild[0:0]/quest[0:0]', written: { userRequest: 'seeded' } }),
          OpSetStub({ ref: 'guild[0:0]/quest[0:1]', written: { userRequest: 'seeded' } }),
          OpSetStub({ ref: 'guild[0:0]/quest[0:2]', written: { userRequest: 'seeded' } }),
          OpSetStub({ ref: 'guild[0:0]/quest[0:0]', written: { title: 'only the first' } }),
        ],
      });

      const result = planFoldWritesTransformer({ plan });

      expect(result).toStrictEqual(
        HydrationPlanStub({
          ops: [
            OpCreateStub({
              ref: 'guild[0:0]/quest[0:0]',
              ancestors: ['guild[0:0]'],
              index: 0,
              fields: { userRequest: 'seeded', title: 'only the first' },
            }),
            OpCreateStub({
              ref: 'guild[0:0]/quest[0:1]',
              ancestors: ['guild[0:0]'],
              index: 1,
              fields: { userRequest: 'seeded' },
            }),
            OpCreateStub({
              ref: 'guild[0:0]/quest[0:2]',
              ancestors: ['guild[0:0]'],
              index: 2,
              fields: { userRequest: 'seeded' },
            }),
          ],
        }),
      );
    });
  });

  describe('one plain field and one transition on the same set op', () => {
    it('VALID: {set {status: "in_progress", title: "x"}} => title folds, the transition-only set op stays', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ref: 'guild[0:0]/quest[0:0]', ancestors: ['guild[0:0]'], fields: {} }),
          OpSetStub({
            ref: 'guild[0:0]/quest[0:0]',
            written: { title: 'x' },
            transition: { field: 'status', to: 'in_progress' },
          }),
        ],
      });

      const result = planFoldWritesTransformer({ plan });

      expect(result).toStrictEqual(
        HydrationPlanStub({
          ops: [
            OpCreateStub({
              ref: 'guild[0:0]/quest[0:0]',
              ancestors: ['guild[0:0]'],
              fields: { title: 'x' },
            }),
            OpSetStub({
              ref: 'guild[0:0]/quest[0:0]',
              written: {},
              transition: { field: 'status', to: 'in_progress' },
            }),
          ],
        }),
      );
    });
  });

  describe('a setRaw op — written with no transition key at all', () => {
    it('VALID: {setRaw {status: "complete"}} => folds into create, and no set op remains', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ref: 'guild[0:0]/quest[0:0]', ancestors: ['guild[0:0]'], fields: {} }),
          OpSetStub({ ref: 'guild[0:0]/quest[0:0]', written: { status: 'complete' } }),
        ],
      });

      const result = planFoldWritesTransformer({ plan });

      expect(result).toStrictEqual(
        HydrationPlanStub({
          ops: [
            OpCreateStub({
              ref: 'guild[0:0]/quest[0:0]',
              ancestors: ['guild[0:0]'],
              fields: { status: 'complete' },
            }),
          ],
        }),
      );
    });
  });

  describe('a fromSaved value naming a record saved after the matching create', () => {
    it('VALID: {q[0].saveRecordAs("first") then q[1].set({x: fromSaved("first")})} => the set op is NOT folded', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ref: 'guild[0:0]/quest[0:0]',
            ancestors: ['guild[0:0]'],
            index: 0,
            fields: {},
          }),
          OpCreateStub({
            ref: 'guild[0:0]/quest[0:1]',
            ancestors: ['guild[0:0]'],
            index: 1,
            fields: {},
          }),
          OpSaveRecordStub({ ref: 'guild[0:0]/quest[0:0]', name: 'first' }),
          OpSetStub({
            ref: 'guild[0:0]/quest[0:1]',
            written: { x: SavedRefStub({ name: 'first' }) },
          }),
        ],
      });

      const result = planFoldWritesTransformer({ plan });

      expect(result).toStrictEqual(plan);
    });
  });

  describe('a set op targeting a ref already removed', () => {
    it('VALID: {create quest[0:0], remove quest[0:0], set quest[0:0]} => the set op is NOT folded into create', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ref: 'guild[0:0]/quest[0:0]',
            ancestors: ['guild[0:0]'],
            index: 0,
            fields: {},
          }),
          OpRemoveStub({ ref: 'guild[0:0]/quest[0:0]' }),
          OpSetStub({ ref: 'guild[0:0]/quest[0:0]', written: { title: 'after remove' } }),
        ],
      });

      const result = planFoldWritesTransformer({ plan });

      expect(result).toStrictEqual(plan);
    });

    it('VALID: {create, set before remove, remove, set after remove} => only the first set folds into create', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ref: 'guild[0:0]/quest[0:0]',
            ancestors: ['guild[0:0]'],
            index: 0,
            fields: {},
          }),
          OpSetStub({ ref: 'guild[0:0]/quest[0:0]', written: { title: 'before remove' } }),
          OpRemoveStub({ ref: 'guild[0:0]/quest[0:0]' }),
          OpSetStub({ ref: 'guild[0:0]/quest[0:0]', written: { title: 'after remove' } }),
        ],
      });

      const result = planFoldWritesTransformer({ plan });

      expect(result).toStrictEqual(
        HydrationPlanStub({
          ops: [
            OpCreateStub({
              ref: 'guild[0:0]/quest[0:0]',
              ancestors: ['guild[0:0]'],
              index: 0,
              fields: { title: 'before remove' },
            }),
            OpRemoveStub({ ref: 'guild[0:0]/quest[0:0]' }),
            OpSetStub({ ref: 'guild[0:0]/quest[0:0]', written: { title: 'after remove' } }),
          ],
        }),
      );
    });
  });

  describe('two sibling add calls under one host, run through the real chain', () => {
    it('VALID: {collection.add(1, setTitle("first-pair")) then collection.add(1, setTitle("second-pair"))} => both pairs of fields survive folding, on two distinct create ops', () => {
      const collection = collectionChainTransformer<typeof questIngredient>({
        registry: { quests: questIngredient },
        ingredientConfig: questIngredient as unknown as IngredientConfigData,
        ancestors: [],
        ancestorNames: [],
      });

      const firstPair = collection.add(1, (q) => [
        q[0].set({ title: questFieldsContract.shape.title.parse('first-pair') }),
      ]) as unknown as HydrationOp[];
      const secondPair = collection.add(1, (q) => [
        q[0].set({ title: questFieldsContract.shape.title.parse('second-pair') }),
      ]) as unknown as HydrationOp[];

      const plan = HydrationPlanStub({ ops: [...firstPair, ...secondPair] });

      const result = planFoldWritesTransformer({ plan });

      expect(result).toStrictEqual(
        HydrationPlanStub({
          ops: [
            OpCreateStub({
              ingredient: 'quest',
              ref: 'quest[0:0]',
              index: 0,
              ancestors: [],
              fields: { title: 'first-pair' },
            }),
            OpCreateStub({
              ingredient: 'quest',
              ref: 'quest[1:0]',
              index: 0,
              ancestors: [],
              fields: { title: 'second-pair' },
            }),
          ],
        }),
      );
    });
  });
});
