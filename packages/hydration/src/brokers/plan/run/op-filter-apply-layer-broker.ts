/**
 * PURPOSE: Runs a `filter` op — queries LIVE state for the rows it actually matches, refuses a
 * match count `expect` does not allow, and replays the filter's own nested ops once per matched
 * row. Reach for this over every other layer whenever a row is selected by VALUE rather than named
 * directly: every other op targets a `ref` the chain already resolved at build time, and this is
 * the one op whose row count is a fact about the gates rather than about the recipe — including
 * rows a TRANSITION in the same walk just minted, since the query runs against whatever the
 * ingredient's own `query` route sees at that moment, not against the plan.
 *
 * A query that THROWS is `HydrationQueryFailedError` — the app was unreachable. A query that
 * resolves with fewer rows than `expect` allows is `HydrationFilterExpectationError` — the app
 * answered fine and the row simply was not there. The two stay distinct on purpose (sad-path row 7).
 *
 * USAGE:
 * await opFilterApplyLayerBroker({ op, target, config, state });
 * // Returns the mutated state, with every matched row's nested ops already applied
 */
import { fieldValuesResolveTransformer } from '../../../transformers/field-values-resolve/field-values-resolve-transformer';
import { filterScopeWhereTransformer } from '../../../transformers/filter-scope-where/filter-scope-where-transformer';
import { matchedRowRebindTransformer } from '../../../transformers/matched-row-rebind/matched-row-rebind-transformer';
import { routeSelectTransformer } from '../../../transformers/route-select/route-select-transformer';
import { isFilterExpectSatisfiedGuard } from '../../../guards/is-filter-expect-satisfied/is-filter-expect-satisfied-guard';
import { opCreateApplyLayerBroker } from './op-create-apply-layer-broker';
import { opSetApplyLayerBroker } from './op-set-apply-layer-broker';
import { opUpdateApplyLayerBroker } from './op-update-apply-layer-broker';
import { opRemoveApplyLayerBroker } from './op-remove-apply-layer-broker';
import { opSaveRecordApplyLayerBroker } from './op-save-record-apply-layer-broker';
import { opExtraApplyLayerBroker } from './op-extra-apply-layer-broker';
import { HydrationQueryFailedError } from '../../../errors/hydration-query-failed/hydration-query-failed-error';
import { HydrationFilterExpectationError } from '../../../errors/hydration-filter-expectation/hydration-filter-expectation-error';
import type { OpFilter, OpFilterNestedOp } from '../../../contracts/op-filter/op-filter-contract';
import type { HydrationTarget } from '../../../contracts/hydration-target/hydration-target-contract';
import type { IngredientConfigData } from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { HydrationRunState } from '../../../contracts/hydration-run-state/hydration-run-state-contract';

export const opFilterApplyLayerBroker = async ({
  op,
  target,
  config,
  state,
}: {
  op: OpFilter;
  target: HydrationTarget;
  config: IngredientConfigData;
  state: HydrationRunState;
}): Promise<HydrationRunState> => {
  const resolvedWhere = fieldValuesResolveTransformer({ values: op.where, saved: state.saved });
  const narrowedWhere = filterScopeWhereTransformer({
    where: resolvedWhere,
    ...(op.scope === undefined ? {} : { scope: op.scope }),
    links: config.links ?? [],
    records: state.records,
  });

  const matchedRecords: readonly unknown[] = await (async (): Promise<readonly unknown[]> => {
    try {
      const rawMatches = await config.routes.query?.({ target, where: narrowedWhere });
      return Array.isArray(rawMatches) ? rawMatches : [];
    } catch (cause) {
      throw new HydrationQueryFailedError({
        recipeName: state.recipeName,
        ingredientName: op.ingredient,
        where: JSON.stringify(narrowedWhere),
        cause,
      });
    }
  })();

  if (!isFilterExpectSatisfiedGuard({ expect: op.expect, count: matchedRecords.length })) {
    throw new HydrationFilterExpectationError({
      recipeName: state.recipeName,
      ingredientName: op.ingredient,
      where: JSON.stringify(narrowedWhere),
      expect: op.expect,
      matchedCount: matchedRecords.length,
    });
  }

  return matchedRecords.reduce<Promise<HydrationRunState>>(async (previousRow, matchedRecord) => {
    const rowState = matchedRowRebindTransformer({
      state: await previousRow,
      matchedRef: op.matchedRef,
      record: matchedRecord,
    });

    return op.ops.reduce<Promise<HydrationRunState>>(
      async (previousOp, nestedOp: OpFilterNestedOp) => {
        const currentState = await previousOp;

        if (nestedOp.op === 'create') {
          // `Matched<I>` exposes no `add`, so the real chain never produces this branch — kept
          // because `OpFilterNestedOp` shares all six branches with `HydrationOp` for parsing
          // symmetry (see `op-filter-contract.ts`), and a hand-built plan may still carry one.
          const route = routeSelectTransformer({
            routes: config.routes,
            hasBaseUrl: target.baseUrl !== undefined,
          });
          if (route === null) {
            return currentState;
          }
          return opCreateApplyLayerBroker({
            op: nestedOp,
            target,
            config,
            route,
            state: currentState,
          });
        }
        if (nestedOp.op === 'set') {
          if (Object.keys(nestedOp.written).length > 0) {
            return opUpdateApplyLayerBroker({ op: nestedOp, target, config, state: currentState });
          }
          if (nestedOp.transition === undefined) {
            return currentState;
          }
          return opSetApplyLayerBroker({ op: nestedOp, target, config, state: currentState });
        }
        if (nestedOp.op === 'remove') {
          return opRemoveApplyLayerBroker({ op: nestedOp, target, config, state: currentState });
        }
        if (nestedOp.op === 'saveRecord') {
          return opSaveRecordApplyLayerBroker({ op: nestedOp, state: currentState });
        }
        if (nestedOp.op === 'extra') {
          return opExtraApplyLayerBroker({ op: nestedOp, target, config, state: currentState });
        }
        // A nested `filter`: `Matched<I>` exposes no child collection either, so this is equally
        // unreachable via the real chain — kept for the same parsing-symmetry reason as `create`.
        return opFilterApplyLayerBroker({ op: nestedOp, target, config, state: currentState });
      },
      Promise.resolve(rowState),
    );
  }, Promise.resolve(state));
};
