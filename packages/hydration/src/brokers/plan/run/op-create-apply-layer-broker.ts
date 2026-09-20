/**
 * PURPOSE: Makes one row — resolves its cross-links, fills its foreign keys from its ancestors,
 * calls the one route this target can serve, and parses what came back through the ingredient's
 * `record`. Reach for this over the other layers for anything a plan MINTS; every other op targets a
 * ref this one already put in the walk's state.
 *
 * A route that THROWS is classified by which kind the pre-flight selected: a `write` route's failure
 * is named by its path (`HydrationWriteFailedError`); an `api` or `recording` route's failure is
 * named by its URL, status and body (`HydrationRouteFailedError`). The runner has no independent
 * source for the URL (`RouteFn` carries `target` and `fields`, never a URL) — it passes through
 * whatever `routeFailureTransformer` mined, `null` included, and the error names that honestly
 * rather than fabricating one.
 *
 * USAGE:
 * await opCreateApplyLayerBroker({ op, target, config, route: 'write', state });
 * // Returns the mutated state, with state.records.get(op.ref) now holding the parsed record
 */
import { fieldValuesResolveTransformer } from '../../../transformers/field-values-resolve/field-values-resolve-transformer';
import { linkValuesTransformer } from '../../../transformers/link-values/link-values-transformer';
import { routeFailureTransformer } from '../../../transformers/route-failure/route-failure-transformer';
import { writeFailureTransformer } from '../../../transformers/write-failure/write-failure-transformer';
import { HydrationRecordShapeError } from '../../../errors/hydration-record-shape/hydration-record-shape-error';
import { HydrationRouteFailedError } from '../../../errors/hydration-route-failed/hydration-route-failed-error';
import { HydrationWriteFailedError } from '../../../errors/hydration-write-failed/hydration-write-failed-error';
import type { OpCreate } from '../../../contracts/op-create/op-create-contract';
import type { HydrationTarget } from '../../../contracts/hydration-target/hydration-target-contract';
import type {
  IngredientConfigData,
  AnyZodSchema,
} from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { HydrationRoute } from '../../../contracts/hydration-route/hydration-route-contract';
import type { HydrationRunState } from '../../../contracts/hydration-run-state/hydration-run-state-contract';

const UNKNOWN_PATH = '(unknown path)';
const UNKNOWN_FIELD = '(root)';

export const opCreateApplyLayerBroker = async ({
  op,
  target,
  config,
  route,
  state,
}: {
  op: OpCreate;
  target: HydrationTarget;
  config: IngredientConfigData;
  route: HydrationRoute;
  state: HydrationRunState;
}): Promise<HydrationRunState> => {
  const resolvedFields = fieldValuesResolveTransformer({ values: op.fields, saved: state.saved });

  const linkResult = linkValuesTransformer({
    links: config.links ?? [],
    ancestors: op.ancestors,
    ownFields: resolvedFields,
    records: state.records,
  });
  // The pre-flight already refused any row whose links cannot be filled, before the first write —
  // `linkResult.ok` is always true by the time the walk reaches here.
  const fields = { ...resolvedFields, ...(linkResult.ok ? linkResult.values : {}) };

  // Total by construction: `route` is one of `config.routes`' own keys, selected because it WAS
  // declared (the pre-flight refused any plan needing an undeclared one) — see Q1.
  const routeFn = config.routes[route];

  // A `const` IIFE rather than a `let` assigned inside `try`: an unread initializer trips
  // `no-useless-assignment`, and `undefined` trips `no-undef-init` the moment one is added to
  // satisfy `init-declarations` instead — this shape satisfies all three without a variable that
  // is ever briefly wrong.
  const rawRecord: unknown = await (async (): Promise<unknown> => {
    try {
      return await routeFn?.({ target, fields });
    } catch (cause) {
      if (route === 'write') {
        const writeFailure = writeFailureTransformer({ cause });
        throw new HydrationWriteFailedError({
          recipeName: state.recipeName,
          ingredientName: op.ingredient,
          path: writeFailure.path ?? UNKNOWN_PATH,
          cause,
        });
      }
      const routeFailure = routeFailureTransformer({ cause });
      throw new HydrationRouteFailedError({
        recipeName: state.recipeName,
        ingredientName: op.ingredient,
        route,
        url: routeFailure.url,
        status: routeFailure.status,
        responseBody: routeFailure.responseBody,
        cause,
      });
    }
  })();

  // `record` is stored as `unknown` on `IngredientConfigData` (only `contracts/` may import `zod`
  // itself), but is genuinely a `z.ZodType` once `ingredientConfigContract.parse` accepted it.
  const recordSchema = config.record as AnyZodSchema;
  const parsedRecord = recordSchema.safeParse(rawRecord);
  if (!parsedRecord.success) {
    const [firstIssue] = parsedRecord.error.issues;
    throw new HydrationRecordShapeError({
      recipeName: state.recipeName,
      ingredientName: op.ingredient,
      route,
      fieldName:
        firstIssue === undefined ? UNKNOWN_FIELD : String(firstIssue.path[0] ?? UNKNOWN_FIELD),
      validationMessage: firstIssue === undefined ? 'Required' : firstIssue.message,
    });
  }

  state.records.set(op.ref, parsedRecord.data);
  return state;
};
