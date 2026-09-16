/**
 * PURPOSE: Applies the WRITTEN half of a `set` the fold could not merge into a `create` — a
 * forward-referencing cross-link, or a `set` a `filter` matched (Q2's ruling: neither row exists
 * yet in this walk as a fresh `create`, so neither has one to fold onto). Reach for
 * `opSetApplyLayerBroker` alone when `written` is empty; this layer calls it in turn for any
 * `transition` the same op also carries, once the written half has landed, so `reach`'s own
 * `record` argument already reflects the plain fields.
 *
 * USAGE:
 * await opUpdateApplyLayerBroker({ op, target, config, state });
 * // Returns the mutated state, with state.records.get(op.ref) now holding what `update` (and, if
 * // present, the transition's `reach`) produced
 */
import { fieldValuesResolveTransformer } from '../../../transformers/field-values-resolve/field-values-resolve-transformer';
import { rowRefIngredientTransformer } from '../../../transformers/row-ref-ingredient/row-ref-ingredient-transformer';
import { routeFailureTransformer } from '../../../transformers/route-failure/route-failure-transformer';
import { opSetApplyLayerBroker } from './op-set-apply-layer-broker';
import { HydrationRecordShapeError } from '../../../errors/hydration-record-shape/hydration-record-shape-error';
import { HydrationRouteFailedError } from '../../../errors/hydration-route-failed/hydration-route-failed-error';
import type { OpSet } from '../../../contracts/op-set/op-set-contract';
import type { HydrationTarget } from '../../../contracts/hydration-target/hydration-target-contract';
import type {
  IngredientConfigData,
  AnyZodSchema,
} from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { HydrationRunState } from '../../../contracts/hydration-run-state/hydration-run-state-contract';

const UNKNOWN_FIELD = '(root)';

export const opUpdateApplyLayerBroker = async ({
  op,
  target,
  config,
  state,
}: {
  op: OpSet;
  target: HydrationTarget;
  config: IngredientConfigData;
  state: HydrationRunState;
}): Promise<HydrationRunState> => {
  if (Object.keys(op.written).length === 0) {
    if (op.transition === undefined) {
      return state;
    }
    return opSetApplyLayerBroker({ op, target, config, state });
  }

  const ingredientName = rowRefIngredientTransformer({ rowRef: op.ref });
  const record = (state.records.get(op.ref) ?? {}) as Record<string, unknown>;
  const resolvedFields = fieldValuesResolveTransformer({ values: op.written, saved: state.saved });

  const rawRecord: unknown = await (async (): Promise<unknown> => {
    try {
      return await config.routes.update?.({ target, record, fields: resolvedFields });
    } catch (cause) {
      const routeFailure = routeFailureTransformer({ cause });
      throw new HydrationRouteFailedError({
        recipeName: state.recipeName,
        ingredientName,
        route: 'update',
        url: routeFailure.url,
        status: routeFailure.status,
        responseBody: routeFailure.responseBody,
        cause,
      });
    }
  })();

  const recordSchema = config.record as AnyZodSchema;
  const parsedRecord = recordSchema.safeParse(rawRecord);
  if (!parsedRecord.success) {
    const [firstIssue] = parsedRecord.error.issues;
    throw new HydrationRecordShapeError({
      recipeName: state.recipeName,
      ingredientName,
      route: 'update',
      fieldName:
        firstIssue === undefined ? UNKNOWN_FIELD : String(firstIssue.path[0] ?? UNKNOWN_FIELD),
      validationMessage: firstIssue === undefined ? 'Required' : firstIssue.message,
    });
  }

  state.records.set(op.ref, parsedRecord.data);

  if (op.transition === undefined) {
    return state;
  }
  return opSetApplyLayerBroker({ op, target, config, state });
};
