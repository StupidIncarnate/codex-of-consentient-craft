import { planRunsTransformer } from './plan-runs-transformer';
import { HydrationPlanStub } from '../../contracts/hydration-plan/hydration-plan.stub';
import { OpCreateStub } from '../../contracts/op-create/op-create.stub';
import { OpFilterStub } from '../../contracts/op-filter/op-filter.stub';
import { OpRemoveStub } from '../../contracts/op-remove/op-remove.stub';
import { IngredientConfigStub } from '../../contracts/ingredient-config/ingredient-config.stub';

describe('planRunsTransformer', () => {
  describe('every created ingredient declares a write route', () => {
    it('VALID: {guild and quest both writable} => returns serverless true', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:0]',
            index: 0,
            ancestors: ['guild[0:0]'],
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({ name: 'guild', routes: { write: (): unknown => undefined } }),
        IngredientConfigStub({ name: 'quest', routes: { write: (): unknown => undefined } }),
      ];

      const result = planRunsTransformer({ plan, ingredients });

      expect(result).toStrictEqual({ serverless: true });
    });
  });

  // The case that separates an ALL from an ANY: three of the four created ingredients declare a
  // write route and one (guild) does not. An ANY-over-writable-routes reading finds `quest`
  // writable on its first check and would wrongly answer serverless — the ALL this transformer
  // implements must keep checking and name the one ingredient that blocks it.
  describe('one api-only ingredient among a majority of writable ones', () => {
    it('VALID: {quest, session, operation writable; guild api-only, declared third} => returns serverless false naming guild', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({ ingredient: 'session', ref: 'session[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({ ingredient: 'operation', ref: 'operation[0:0]', index: 0, ancestors: [] }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({ name: 'quest', routes: { write: (): unknown => undefined } }),
        IngredientConfigStub({ name: 'session', routes: { write: (): unknown => undefined } }),
        IngredientConfigStub({ name: 'guild', routes: { api: (): unknown => undefined } }),
        IngredientConfigStub({ name: 'operation', routes: { write: (): unknown => undefined } }),
      ];

      const result = planRunsTransformer({ plan, ingredients });

      expect(result).toStrictEqual({ serverless: false, needsServerFor: 'guild' });
    });
  });

  describe('two api-only ingredients', () => {
    it('VALID: {guild and session both api-only, guild declared first} => names guild, not session', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({ ingredient: 'session', ref: 'session[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({ name: 'guild', routes: { api: (): unknown => undefined } }),
        IngredientConfigStub({ name: 'session', routes: { api: (): unknown => undefined } }),
        IngredientConfigStub({ name: 'quest', routes: { write: (): unknown => undefined } }),
      ];

      const result = planRunsTransformer({ plan, ingredients });

      expect(result).toStrictEqual({ serverless: false, needsServerFor: 'guild' });
    });
  });

  // Q10's own guard: re-expressing this on `routeSelectTransformer` must not WIDEN the rule.
  // `routeSelectTransformer({routes: {recording}, hasBaseUrl: false})` selects `'recording'`
  // (not `null`), so comparing against "not null" would wrongly call this serverless.
  describe('a recording-only ingredient — the divergence this transformer must not paper over', () => {
    it('VALID: {guild recording-only, quest writable} => still returns serverless false naming guild', () => {
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({ name: 'guild', routes: { recording: (): unknown => undefined } }),
        IngredientConfigStub({ name: 'quest', routes: { write: (): unknown => undefined } }),
      ];

      const result = planRunsTransformer({ plan, ingredients });

      expect(result).toStrictEqual({ serverless: false, needsServerFor: 'guild' });
    });
  });

  describe('an ingredient reached only through a filter, never created', () => {
    it('VALID: {quest writable, a filter targets operation with no create op at all} => still returns serverless true', () => {
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
      const ingredients = [
        IngredientConfigStub({ name: 'quest', routes: { write: (): unknown => undefined } }),
      ];

      const result = planRunsTransformer({ plan, ingredients });

      expect(result).toStrictEqual({ serverless: true });
    });
  });
});
