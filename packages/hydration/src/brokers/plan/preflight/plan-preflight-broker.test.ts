import { planPreflightBroker } from './plan-preflight-broker';
import { planPreflightBrokerProxy } from './plan-preflight-broker.proxy';
import { HydrationPlanStub } from '../../../contracts/hydration-plan/hydration-plan.stub';
import { OpCreateStub } from '../../../contracts/op-create/op-create.stub';
import { OpSetStub } from '../../../contracts/op-set/op-set.stub';
import { OpRemoveStub } from '../../../contracts/op-remove/op-remove.stub';
import { OpFilterStub } from '../../../contracts/op-filter/op-filter.stub';
import { OpSaveRecordStub } from '../../../contracts/op-save-record/op-save-record.stub';
import { OpExtraStub } from '../../../contracts/op-extra/op-extra.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { LinkSpecStub } from '../../../contracts/link-spec/link-spec.stub';
import { TransitionSpecStub } from '../../../contracts/transition-spec/transition-spec.stub';
import { HydrationTargetStub } from '../../../contracts/hydration-target/hydration-target.stub';
import { SavedRefStub } from '../../../contracts/saved-ref/saved-ref.stub';
import { HydrationRouteUnavailableError } from '../../../errors/hydration-route-unavailable/hydration-route-unavailable-error';
import { HydrationSavedFieldMissingError } from '../../../errors/hydration-saved-field-missing/hydration-saved-field-missing-error';
import { HydrationSavedRecordMissingError } from '../../../errors/hydration-saved-record-missing/hydration-saved-record-missing-error';
import { HydrationUnlinkedRowError } from '../../../errors/hydration-unlinked-row/hydration-unlinked-row-error';
import { HydrationRouteVerbUnavailableError } from '../../../errors/hydration-route-verb-unavailable/hydration-route-verb-unavailable-error';
import { HydrationTransitionUnreachableError } from '../../../errors/hydration-transition-unreachable/hydration-transition-unreachable-error';
import { HydrationRemovedHandleVerbError } from '../../../errors/hydration-removed-handle-verb/hydration-removed-handle-verb-error';

describe('planPreflightBroker', () => {
  describe('routes — an ingredient needs a route this target cannot serve', () => {
    it('INVALID: {an api-only guild, a target with no baseUrl} => throws HydrationRouteUnavailableError', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] })],
      });
      const ingredients = [
        IngredientConfigStub({ name: 'guild', routes: { api: (): unknown => undefined } }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(HydrationRouteUnavailableError);
    });

    it('INVALID: {an api-only guild, a target with no baseUrl} => names the ingredient, its routes and what the target lacks', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] })],
      });
      const ingredients = [
        IngredientConfigStub({ name: 'guild', routes: { api: (): unknown => undefined } }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(
        /^recipe "guild-mid-execution": ingredient "guild" needs a route this target cannot serve\. Routes it declares: api\. The target lacks a baseUrl, so the api route has nothing to call$/u,
      );
    });

    // The ALL, not the ANY: three of four created ingredients declare a write route and one
    // (guild, declared third) does not. An ANY reading would find `quest` writable first and
    // wrongly pass; the ALL this broker implements keeps checking and names the blocking one.
    it('INVALID: {three writable ingredients and one api-only, no baseUrl} => still refuses, naming the api-only one', () => {
      planPreflightBrokerProxy();
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

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(
        /^recipe "guild-mid-execution": ingredient "guild" needs a route this target cannot serve\. Routes it declares: api\. The target lacks a baseUrl, so the api route has nothing to call$/u,
      );
    });
  });

  describe('fromSaved — a cross-link names a record no op in this plan saves, or one declared later', () => {
    it('INVALID: {fromSaved("origin"), nothing saves it} => throws HydrationSavedRecordMissingError with "(none)"', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:0]',
            index: 0,
            ancestors: [],
            fields: { userRequest: SavedRefStub({ name: 'origin' }) },
          }),
        ],
      });
      const ingredients = [IngredientConfigStub({ name: 'quest' })];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(HydrationSavedRecordMissingError);
    });

    it('INVALID: {fromSaved("origin"), nothing saves it} => lists "(none)" available', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:0]',
            index: 0,
            ancestors: [],
            fields: { userRequest: SavedRefStub({ name: 'origin' }) },
          }),
        ],
      });
      const ingredients = [IngredientConfigStub({ name: 'quest' })];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(
        /^recipe "guild-mid-execution": ingredient "quest" calls fromSaved\("origin"\), but no op in this plan saves that name\. Names saved by this plan: \(none\)$/u,
      );
    });

    // The ORDERING case: `origin` IS saved somewhere in this plan, just not before the op that
    // reaches for it. The available list still names it — that is what proves this is ordering
    // rather than a plain miss.
    it('INVALID: {fromSaved("origin") declared before the saveRecordAs that makes it} => names origin as available', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:0]',
            index: 0,
            ancestors: [],
            fields: { userRequest: SavedRefStub({ name: 'origin' }) },
          }),
          OpCreateStub({ ingredient: 'session', ref: 'session[0:0]', index: 0, ancestors: [] }),
          OpSaveRecordStub({ ref: 'session[0:0]', name: 'origin' }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({ name: 'quest' }),
        IngredientConfigStub({ name: 'session' }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(
        /^recipe "guild-mid-execution": ingredient "quest" calls fromSaved\("origin"\), but no op in this plan saves that name\. Names saved by this plan: origin$/u,
      );
    });
  });

  describe('fromSaved field — a cross-link names a field its saved record’s own producing ingredient never declared', () => {
    it('VALID: {fromSaved("origin", "id"), the saved ingredient’s record declares "id"} => returns the accepted route plan', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'session', ref: 'session[0:0]', index: 0, ancestors: [] }),
          OpSaveRecordStub({ ref: 'session[0:0]', name: 'origin' }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:0]',
            index: 0,
            ancestors: [],
            fields: { userRequest: SavedRefStub({ name: 'origin', field: 'id' }) },
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({ name: 'session' }),
        IngredientConfigStub({ name: 'quest' }),
      ];

      const result = planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients });

      expect(result).toStrictEqual({ session: 'write', quest: 'write' });
    });

    it('INVALID: {fromSaved("origin", "urlSlug"), the saved ingredient’s record never declares "urlSlug"} => throws HydrationSavedFieldMissingError', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'session', ref: 'session[0:0]', index: 0, ancestors: [] }),
          OpSaveRecordStub({ ref: 'session[0:0]', name: 'origin' }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:0]',
            index: 0,
            ancestors: [],
            fields: { userRequest: SavedRefStub({ name: 'origin', field: 'urlSlug' }) },
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({ name: 'session' }),
        IngredientConfigStub({ name: 'quest' }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(HydrationSavedFieldMissingError);
    });

    it('INVALID: {fromSaved("origin", "urlSlug"), the saved ingredient’s record never declares "urlSlug"} => names the record, the field, and the fields it does declare', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'session', ref: 'session[0:0]', index: 0, ancestors: [] }),
          OpSaveRecordStub({ ref: 'session[0:0]', name: 'origin' }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:0]',
            index: 0,
            ancestors: [],
            fields: { userRequest: SavedRefStub({ name: 'origin', field: 'urlSlug' }) },
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({ name: 'session' }),
        IngredientConfigStub({ name: 'quest' }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(
        /^recipe "guild-mid-execution": ingredient "quest" calls fromSaved\("origin", "urlSlug"\), but the record saved as "origin" never declares that field\. Fields it declares: id, title$/u,
      );
    });
  });

  describe('links — a row whose links no ancestor supplies, including one added at top level', () => {
    it('INVALID: {dm.quests.add(1, …) at top level} => throws HydrationUnlinkedRowError', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] })],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(HydrationUnlinkedRowError);
    });

    it('INVALID: {dm.quests.add(1, …) at top level} => throws naming quest and guild', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] })],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(
        /^recipe "guild-mid-execution": ingredient "quest" needs a "guild" ancestor to fill its link, but this row has none — including a row added at the top level, which the type system allows freely$/u,
      );
    });

    it('VALID: {an operation whose ancestors carry both a guild and a quest} => returns its selected route', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'operation',
            ref: 'guild[0:0]/quest[0:0]/operation[0:0]',
            index: 0,
            ancestors: ['guild[0:0]', 'guild[0:0]/quest[0:0]'],
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'operation',
          links: [
            LinkSpecStub({ of: 'quest', as: 'questId' }),
            LinkSpecStub({ of: 'guild', as: 'guildId' }),
          ],
        }),
      ];

      const result = planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients });

      expect(result).toStrictEqual({ operation: 'write' });
    });

    // The two-link case: `quest` is satisfied by an ancestor, `guild` is not — condition 2 alone
    // (every link satisfied) is what this proves, over the single-link case above.
    it('INVALID: {an operation under a quest with no guild anywhere} => throws naming guild', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'operation',
            ref: 'quest[0:0]/operation[0:0]',
            index: 0,
            ancestors: ['quest[0:0]'],
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'operation',
          links: [
            LinkSpecStub({ of: 'quest', as: 'questId' }),
            LinkSpecStub({ of: 'guild', as: 'guildId' }),
          ],
        }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(
        /^recipe "guild-mid-execution": ingredient "operation" needs a "guild" ancestor to fill its link, but this row has none — including a row added at the top level, which the type system allows freely$/u,
      );
    });
  });

  describe('a fully valid plan, shaped like the specification’s guild-mid-execution', () => {
    it('VALID: {guild, quest, and a filter+remove over operation, against a target with a baseUrl} => returns the accepted route plan', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:0]',
            index: 0,
            ancestors: ['guild[0:0]'],
          }),
          OpFilterStub({
            ingredient: 'operation',
            scope: 'guild[0:0]/quest[0:0]',
            where: { role: 'riftcarver' },
            expect: 'one',
            matchedRef: 'guild[0:0]/quest[0:0]/operation[match]',
            ops: [OpRemoveStub({ ref: 'guild[0:0]/quest[0:0]/operation[match]' })],
          }),
          OpSaveRecordStub({ ref: 'guild[0:0]/quest[0:0]', name: 'quest' }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'guild',
          routes: { api: (): unknown => undefined, write: (): unknown => undefined },
        }),
        IngredientConfigStub({
          name: 'quest',
          routes: { api: (): unknown => undefined, write: (): unknown => undefined },
          links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        }),
        IngredientConfigStub({
          name: 'operation',
          routes: {
            write: (): unknown => undefined,
            query: (): unknown => undefined,
            remove: (): unknown => undefined,
          },
        }),
      ];

      const result = planPreflightBroker({
        plan,
        target: HydrationTargetStub({ baseUrl: 'http://localhost:3737' }),
        ingredients,
      });

      expect(result).toStrictEqual({ guild: 'api', quest: 'api' });
    });
  });

  describe('the verb a chain call needs — query, update or remove — and the ingredient declares none', () => {
    it('INVALID: {a filter over an ingredient with no query route} => throws HydrationRouteVerbUnavailableError', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpFilterStub({
            ingredient: 'operation',
            matchedRef: 'operation[match]',
            ops: [],
          }),
        ],
      });
      const ingredients = [IngredientConfigStub({ name: 'operation' })];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(HydrationRouteVerbUnavailableError);
    });

    it('INVALID: {a filter over an ingredient with no query route} => names "query"', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpFilterStub({
            ingredient: 'operation',
            matchedRef: 'operation[match]',
            ops: [],
          }),
        ],
      });
      const ingredients = [IngredientConfigStub({ name: 'operation' })];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(
        /^recipe "guild-mid-execution": ingredient "operation" declares no "query" route, so a call needing one cannot run$/u,
      );
    });

    it('INVALID: {a remove targeting a row whose ingredient has no remove route} => throws naming "remove"', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({ ops: [OpRemoveStub({ ref: 'guild[0:0]/quest[0:1]' })] });
      const ingredients = [IngredientConfigStub({ name: 'quest' })];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(
        /^recipe "guild-mid-execution": ingredient "quest" declares no "remove" route, so a call needing one cannot run$/u,
      );
    });

    // A `set` the fold cannot fold — no `create` op anywhere in this plan shares its `ref` — is an
    // UPDATE, per Q2, and needs the ingredient's own `update` route.
    it('INVALID: {a non-foldable set targeting a row whose ingredient has no update route} => throws naming "update"', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [OpSetStub({ ref: 'guild[0:0]/quest[0:2]', written: { title: 'x' } })],
      });
      const ingredients = [IngredientConfigStub({ name: 'quest' })];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(
        /^recipe "guild-mid-execution": ingredient "quest" declares no "update" route, so a call needing one cannot run$/u,
      );
    });
  });

  describe('transitions — a set asks a "to" off the ingredient’s own list', () => {
    it('INVALID: {a created quest set to "blocked", not on transitions.to} => throws HydrationTransitionUnreachableError', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpSetStub({
            ref: 'quest[0:0]',
            written: {},
            transition: { field: 'status', to: 'blocked' },
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          routes: { write: (): unknown => undefined },
          transitions: TransitionSpecStub({
            field: 'status',
            to: ['created', 'in_progress'],
            reach: (): unknown => undefined,
          }),
        }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(HydrationTransitionUnreachableError);
    });

    it('INVALID: {a created quest set to "blocked", not on transitions.to} => names the ingredient, "blocked" and the reachable states', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpSetStub({
            ref: 'quest[0:0]',
            written: {},
            transition: { field: 'status', to: 'blocked' },
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          routes: { write: (): unknown => undefined },
          transitions: TransitionSpecStub({
            field: 'status',
            to: ['created', 'in_progress'],
            reach: (): unknown => undefined,
          }),
        }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(
        /^recipe "guild-mid-execution": ingredient "quest" asks a transition for "blocked", which is not one of the states it reaches by asking\. States it can reach: created, in_progress$/u,
      );
    });

    // Nothing has run yet — no route has been called and no record exists for `quest[0:0]` — which
    // is what proves this refuses before the first write rather than partway through the walk.
    it('INVALID: {the same unreachable transition, a write route that would otherwise run} => refuses before returning a route plan', () => {
      planPreflightBrokerProxy();
      let writeCallCount = 0;
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpSetStub({
            ref: 'quest[0:0]',
            written: {},
            transition: { field: 'status', to: 'blocked' },
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          routes: {
            write: (): unknown => {
              writeCallCount += 1;
              return undefined;
            },
          },
          transitions: TransitionSpecStub({
            field: 'status',
            to: ['created', 'in_progress'],
            reach: (): unknown => undefined,
          }),
        }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(HydrationTransitionUnreachableError);
      expect(writeCallCount).toBe(0);
    });

    it('VALID: {a created quest set to "in_progress", on transitions.to} => returns the accepted route plan', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpSetStub({
            ref: 'quest[0:0]',
            written: {},
            transition: { field: 'status', to: 'in_progress' },
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          routes: { write: (): unknown => undefined },
          transitions: TransitionSpecStub({
            field: 'status',
            to: ['created', 'in_progress'],
            reach: (): unknown => undefined,
          }),
        }),
      ];

      const result = planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients });

      expect(result).toStrictEqual({ quest: 'write' });
    });
  });

  describe('removed refs — once a row is removed, no further verbs may target it', () => {
    it('INVALID: {remove followed by set} => throws HydrationRemovedHandleVerbError with verb "set"', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpRemoveStub({ ref: 'quest[0:0]' }),
          OpSetStub({ ref: 'quest[0:0]', written: { title: 'updated' } }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          routes: {
            write: (): unknown => undefined,
            remove: (): unknown => undefined,
            update: (): unknown => undefined,
          },
        }),
      ];

      let thrown: unknown = null;
      try {
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients });
      } catch (error: unknown) {
        thrown = error;
      }

      expect(thrown instanceof HydrationRemovedHandleVerbError).toBe(true);

      const error = thrown as HydrationRemovedHandleVerbError;

      expect({
        name: error.name,
        message: error.message,
        ref: error.ref,
        verb: error.verb,
      }).toStrictEqual({
        name: 'HydrationRemovedHandleVerbError',
        message:
          'recipe "guild-mid-execution": ingredient "quest" calls "set" on removed row "quest[0:0]". Once a row is removed, no further verbs may target it.',
        ref: 'quest[0:0]',
        verb: 'set',
      });
    });

    it('INVALID: {remove followed by saveRecordAs} => throws HydrationRemovedHandleVerbError with verb "saveRecordAs"', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpRemoveStub({ ref: 'quest[0:0]' }),
          OpSaveRecordStub({ ref: 'quest[0:0]', name: 'savedQuest' }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          routes: { write: (): unknown => undefined, remove: (): unknown => undefined },
        }),
      ];

      let thrown: unknown = null;
      try {
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients });
      } catch (error: unknown) {
        thrown = error;
      }

      expect(thrown instanceof HydrationRemovedHandleVerbError).toBe(true);

      const error = thrown as HydrationRemovedHandleVerbError;

      expect({
        name: error.name,
        message: error.message,
        ref: error.ref,
        verb: error.verb,
      }).toStrictEqual({
        name: 'HydrationRemovedHandleVerbError',
        message:
          'recipe "guild-mid-execution": ingredient "quest" calls "saveRecordAs" on removed row "quest[0:0]". Once a row is removed, no further verbs may target it.',
        ref: 'quest[0:0]',
        verb: 'saveRecordAs',
      });
    });

    it('INVALID: {remove followed by remove} => throws HydrationRemovedHandleVerbError with verb "remove"', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpRemoveStub({ ref: 'quest[0:0]' }),
          OpRemoveStub({ ref: 'quest[0:0]' }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          routes: { write: (): unknown => undefined, remove: (): unknown => undefined },
        }),
      ];

      let thrown: unknown = null;
      try {
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients });
      } catch (error: unknown) {
        thrown = error;
      }

      expect(thrown instanceof HydrationRemovedHandleVerbError).toBe(true);

      const error = thrown as HydrationRemovedHandleVerbError;

      expect({
        name: error.name,
        message: error.message,
        ref: error.ref,
        verb: error.verb,
      }).toStrictEqual({
        name: 'HydrationRemovedHandleVerbError',
        message:
          'recipe "guild-mid-execution": ingredient "quest" calls "remove" on removed row "quest[0:0]". Once a row is removed, no further verbs may target it.',
        ref: 'quest[0:0]',
        verb: 'remove',
      });
    });

    it('INVALID: {remove followed by extra} => throws HydrationRemovedHandleVerbError with verb op.verb', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpRemoveStub({ ref: 'quest[0:0]' }),
          OpExtraStub({ ref: 'quest[0:0]', verb: 'customAction' }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          routes: { write: (): unknown => undefined, remove: (): unknown => undefined },
        }),
      ];

      let thrown: unknown = null;
      try {
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients });
      } catch (error: unknown) {
        thrown = error;
      }

      expect(thrown instanceof HydrationRemovedHandleVerbError).toBe(true);

      const error = thrown as HydrationRemovedHandleVerbError;

      expect({
        name: error.name,
        message: error.message,
        ref: error.ref,
        verb: error.verb,
      }).toStrictEqual({
        name: 'HydrationRemovedHandleVerbError',
        message:
          'recipe "guild-mid-execution": ingredient "quest" calls "customAction" on removed row "quest[0:0]". Once a row is removed, no further verbs may target it.',
        ref: 'quest[0:0]',
        verb: 'customAction',
      });
    });

    it('VALID: {remove one row, set a different row} => does not throw removed handle error', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:1]', index: 1, ancestors: [] }),
          OpRemoveStub({ ref: 'quest[0:0]' }),
          OpSetStub({ ref: 'quest[0:1]', written: { title: 'other row' } }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          routes: {
            write: (): unknown => undefined,
            remove: (): unknown => undefined,
            update: (): unknown => undefined,
          },
        }),
      ];

      const result = planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients });

      expect(result).toStrictEqual({ quest: 'write' });
    });
  });

  describe('check order — routes, then fromSaved, then links, verb, transitions, and removed refs last', () => {
    it('INVALID: {a plan failing both routes and links} => reports the routes failure', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] })],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          routes: { api: (): unknown => undefined },
          links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(HydrationRouteUnavailableError);
    });

    it('INVALID: {a plan failing both fromSaved and links} => reports the fromSaved failure', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:0]',
            index: 0,
            ancestors: [],
            fields: { userRequest: SavedRefStub({ name: 'missing' }) },
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(HydrationSavedRecordMissingError);
    });

    it('INVALID: {a plan failing both transitions and removed refs} => reports the transitions failure', () => {
      planPreflightBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', index: 0, ancestors: [] }),
          OpRemoveStub({ ref: 'quest[0:0]' }),
          OpSetStub({
            ref: 'quest[0:0]',
            written: {},
            transition: { field: 'status', to: 'blocked' },
          }),
        ],
      });
      const ingredients = [
        IngredientConfigStub({
          name: 'quest',
          routes: {
            write: (): unknown => undefined,
            remove: (): unknown => undefined,
            update: (): unknown => undefined,
          },
          transitions: TransitionSpecStub({
            field: 'status',
            to: ['created', 'in_progress'],
            reach: (): unknown => undefined,
          }),
        }),
      ];

      expect(() =>
        planPreflightBroker({ plan, target: HydrationTargetStub({}), ingredients }),
      ).toThrow(HydrationTransitionUnreachableError);
    });
  });
});
