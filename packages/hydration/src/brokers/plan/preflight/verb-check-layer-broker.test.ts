import { verbCheckLayerBroker } from './verb-check-layer-broker';
import { verbCheckLayerBrokerProxy } from './verb-check-layer-broker.proxy';
import { HydrationPlanStub } from '../../../contracts/hydration-plan/hydration-plan.stub';
import { OpFilterStub } from '../../../contracts/op-filter/op-filter.stub';
import { OpAttachStub } from '../../../contracts/op-attach/op-attach.stub';
import { OpRemoveStub } from '../../../contracts/op-remove/op-remove.stub';
import { OpSetStub } from '../../../contracts/op-set/op-set.stub';
import { OpCreateStub } from '../../../contracts/op-create/op-create.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { IngredientNameStub } from '../../../contracts/ingredient-name/ingredient-name.stub';
import { HydrationRouteVerbUnavailableError } from '../../../errors/hydration-route-verb-unavailable/hydration-route-verb-unavailable-error';

describe('verbCheckLayerBroker', () => {
  describe('a filter over an ingredient with a query route', () => {
    it('VALID: {filter with nested ops} => returns the filter’s own nested ops to keep walking', () => {
      verbCheckLayerBrokerProxy();
      const nested = [OpRemoveStub({ ref: 'operation[match]' })];
      const op = OpFilterStub({
        ingredient: 'operation',
        matchedRef: 'operation[match]',
        ops: nested,
      });
      const configByName = new Map([
        [
          IngredientNameStub({ value: 'operation' }),
          IngredientConfigStub({
            name: 'operation',
            routes: { write: (): unknown => undefined, query: (): unknown => [] },
          }),
        ],
      ]);

      const result = verbCheckLayerBroker({ op, plan: HydrationPlanStub({}), configByName });

      expect(result).toStrictEqual(nested);
    });
  });

  describe('a filter over an ingredient with no query route', () => {
    it('INVALID: {no query route} => throws HydrationRouteVerbUnavailableError naming "query"', () => {
      verbCheckLayerBrokerProxy();
      const op = OpFilterStub({ ingredient: 'operation', matchedRef: 'operation[match]', ops: [] });
      const configByName = new Map([
        [IngredientNameStub({ value: 'operation' }), IngredientConfigStub({ name: 'operation' })],
      ]);

      expect(() => verbCheckLayerBroker({ op, plan: HydrationPlanStub({}), configByName })).toThrow(
        HydrationRouteVerbUnavailableError,
      );
    });
  });

  describe('an attach over an ingredient with a query route', () => {
    it('VALID: {attach} => returns an empty array — attach has no nested ops to walk', () => {
      verbCheckLayerBrokerProxy();
      const op = OpAttachStub({ ingredient: 'quest', ref: 'quest[0:0]', ancestors: [] });
      const configByName = new Map([
        [
          IngredientNameStub({ value: 'quest' }),
          IngredientConfigStub({
            name: 'quest',
            routes: { write: (): unknown => undefined, query: (): unknown => [] },
          }),
        ],
      ]);

      const result = verbCheckLayerBroker({ op, plan: HydrationPlanStub({}), configByName });

      expect(result).toStrictEqual([]);
    });
  });

  describe('an attach over an ingredient with no query route', () => {
    it('INVALID: {no query route} => throws HydrationRouteVerbUnavailableError naming "query"', () => {
      verbCheckLayerBrokerProxy();
      const op = OpAttachStub({ ingredient: 'quest', ref: 'quest[0:0]', ancestors: [] });
      const configByName = new Map([
        [IngredientNameStub({ value: 'quest' }), IngredientConfigStub({ name: 'quest' })],
      ]);

      expect(() => verbCheckLayerBroker({ op, plan: HydrationPlanStub({}), configByName })).toThrow(
        HydrationRouteVerbUnavailableError,
      );
    });
  });

  describe('a remove targeting a row whose ingredient has no remove route', () => {
    it('INVALID: {no remove route} => throws naming "remove"', () => {
      verbCheckLayerBrokerProxy();
      const op = OpRemoveStub({ ref: 'quest[0:0]' });
      const configByName = new Map([
        [IngredientNameStub({ value: 'quest' }), IngredientConfigStub({ name: 'quest' })],
      ]);

      expect(() => verbCheckLayerBroker({ op, plan: HydrationPlanStub({}), configByName })).toThrow(
        /^recipe "guild-mid-execution": ingredient "quest" declares no "remove" route, so a call needing one cannot run$/u,
      );
    });
  });

  describe('a non-foldable set with a written field, whose ingredient has no update route', () => {
    it('INVALID: {no update route} => throws naming "update"', () => {
      verbCheckLayerBrokerProxy();
      const op = OpSetStub({ ref: 'quest[0:0]', written: { title: 'x' } });
      const configByName = new Map([
        [IngredientNameStub({ value: 'quest' }), IngredientConfigStub({ name: 'quest' })],
      ]);

      expect(() => verbCheckLayerBroker({ op, plan: HydrationPlanStub({}), configByName })).toThrow(
        /^recipe "guild-mid-execution": ingredient "quest" declares no "update" route, so a call needing one cannot run$/u,
      );
    });
  });

  describe('op kinds this check has nothing to say about', () => {
    it('VALID: {create} => returns an empty array', () => {
      verbCheckLayerBrokerProxy();
      const op = OpCreateStub();
      const configByName = new Map([
        [IngredientNameStub({ value: 'quest' }), IngredientConfigStub({ name: 'quest' })],
      ]);

      const result = verbCheckLayerBroker({ op, plan: HydrationPlanStub({}), configByName });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {set with no written fields} => returns an empty array, never reaching the update check', () => {
      verbCheckLayerBrokerProxy();
      const op = OpSetStub({ ref: 'quest[0:0]', written: {} });
      const configByName = new Map([
        [IngredientNameStub({ value: 'quest' }), IngredientConfigStub({ name: 'quest' })],
      ]);

      const result = verbCheckLayerBroker({ op, plan: HydrationPlanStub({}), configByName });

      expect(result).toStrictEqual([]);
    });
  });
});
