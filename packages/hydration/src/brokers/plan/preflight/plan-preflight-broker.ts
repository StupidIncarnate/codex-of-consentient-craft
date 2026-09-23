/**
 * PURPOSE: Refuses a plan whose SHAPE cannot work, before anything is on disk. Reach for this over a
 * check inside the walk: a plan's shape is known before anything runs and its results are not, and
 * conflating the two is a bug — a refusal that fires partway through leaves half a plan behind.
 * Checks run in a FIXED order — routes, then fromSaved (a missing NAME, then an undeclared FIELD on
 * a name that does resolve), then links, then the verb a chain call needs, then a `set`'s transition
 * target, then verbs on removed handles — so a plan failing more than one reports the same one every time, never whichever a map
 * iterated first to.
 *
 * USAGE:
 * const routePlan = planPreflightBroker({ plan, target, ingredients });
 * // Returns { guild: 'api', quest: 'write' } or throws one of the six pre-flight error classes
 */
import { routeSelectTransformer } from '../../../transformers/route-select/route-select-transformer';
import { rowRefIngredientTransformer } from '../../../transformers/row-ref-ingredient/row-ref-ingredient-transformer';
import { linkValuesTransformer } from '../../../transformers/link-values/link-values-transformer';
import { planSavedNamesTransformer } from '../../../transformers/plan-saved-names/plan-saved-names-transformer';
import { planFoldWritesTransformer } from '../../../transformers/plan-fold-writes/plan-fold-writes-transformer';
import { verbCheckLayerBroker } from './verb-check-layer-broker';
import { isSavedRefGuard } from '../../../guards/is-saved-ref/is-saved-ref-guard';
import { isReachableTransitionGuard } from '../../../guards/is-reachable-transition/is-reachable-transition-guard';
import { savedRefContract } from '../../../contracts/saved-ref/saved-ref-contract';
import { hydrationRouteContract } from '../../../contracts/hydration-route/hydration-route-contract';
import { routePlanContract } from '../../../contracts/route-plan/route-plan-contract';
import type { RoutePlan } from '../../../contracts/route-plan/route-plan-contract';
import type { HydrationPlan } from '../../../contracts/hydration-plan/hydration-plan-contract';
import type { HydrationOp } from '../../../contracts/hydration-op/hydration-op-contract';
import type { HydrationTarget } from '../../../contracts/hydration-target/hydration-target-contract';
import type { RowRef } from '../../../contracts/row-ref/row-ref-contract';
import type {
  IngredientConfigData,
  AnyZodObjectSchema,
} from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { IngredientName } from '../../../contracts/ingredient-name/ingredient-name-contract';
import type { SavedRecordName } from '../../../contracts/saved-record-name/saved-record-name-contract';
import { HydrationRouteUnavailableError } from '../../../errors/hydration-route-unavailable/hydration-route-unavailable-error';
import { HydrationSavedFieldMissingError } from '../../../errors/hydration-saved-field-missing/hydration-saved-field-missing-error';
import { HydrationSavedRecordMissingError } from '../../../errors/hydration-saved-record-missing/hydration-saved-record-missing-error';
import { HydrationUnlinkedRowError } from '../../../errors/hydration-unlinked-row/hydration-unlinked-row-error';
import { HydrationTransitionUnreachableError } from '../../../errors/hydration-transition-unreachable/hydration-transition-unreachable-error';
import { HydrationRemovedHandleVerbError } from '../../../errors/hydration-removed-handle-verb/hydration-removed-handle-verb-error';

export const planPreflightBroker = ({
  plan,
  target,
  ingredients,
}: {
  plan: HydrationPlan;
  target: HydrationTarget;
  ingredients: readonly IngredientConfigData[];
}): RoutePlan => {
  const hasBaseUrl = target.baseUrl !== undefined;
  const configByName = new Map<IngredientName, IngredientConfigData>(
    ingredients.map((config) => [config.name, config] as const),
  );

  // 1. ROUTES — an ingredient needs a route this target cannot serve. Built alongside the check so
  // the walk reuses the SAME selection later rather than asking `routeSelectTransformer` twice.
  // `configByName.get(...)` stays optional-chained rather than asserted: D1 makes the lookup total
  // by construction (Q1), but `no-non-null-assertion` is a hard ban repo-wide, so the impossible
  // "not found" case degrades to skipping the op rather than asserting past the type.
  const routePlan: Record<string, ReturnType<typeof hydrationRouteContract.parse>> = {};
  const routeCheckStack: HydrationOp[] = [...plan.ops].reverse();
  for (let op = routeCheckStack.pop(); op !== undefined; op = routeCheckStack.pop()) {
    if (op.op === 'create') {
      const config = configByName.get(op.ingredient);
      if (config !== undefined) {
        const { routes } = config;
        const route = routeSelectTransformer({ routes, hasBaseUrl });
        if (route === null) {
          throw new HydrationRouteUnavailableError({
            recipeName: plan.recipeName,
            ingredientName: op.ingredient,
            availableRoutes: hydrationRouteContract.options.filter(
              (candidate) => routes[candidate] !== undefined,
            ),
            targetLacks: 'a baseUrl, so the api route has nothing to call',
          });
        }
        routePlan[op.ingredient] = route;
      }
    }
    if (op.op === 'filter') {
      routeCheckStack.push(...[...op.ops].reverse());
    }
  }

  // 2. FROMSAVED — a cross-link names a record no op in this plan saves, or one declared LATER
  // (checked by NAME first), then, once the name resolves, a FIELD that saved record's own
  // producing ingredient never declared on its `record` contract. `availableSavedRecordNames` is
  // the plan's FULL saved-name list regardless of position, which is what lets the "declared later"
  // case still list the name as available. `savedRecordIngredients` tracks which ingredient
  // produced each saved name, populated at the same `saveRecord` op as `savedSoFar` — a field check
  // only ever runs once the name it depends on is already known, so the two stay in sync by
  // construction.
  const availableSavedRecordNames = planSavedNamesTransformer({ plan });
  const savedSoFar = new Set<SavedRecordName>();
  const savedRecordConfigs = new Map<SavedRecordName, IngredientConfigData>();
  const savedRefCheckStack: HydrationOp[] = [...plan.ops].reverse();
  for (let op = savedRefCheckStack.pop(); op !== undefined; op = savedRefCheckStack.pop()) {
    const candidateValues =
      op.op === 'create'
        ? op.fields
        : op.op === 'set'
          ? op.written
          : op.op === 'extra'
            ? op.args
            : op.op === 'filter' || op.op === 'attach'
              ? op.where
              : undefined;

    if (candidateValues !== undefined) {
      const ingredientName: IngredientName =
        'ingredient' in op ? op.ingredient : rowRefIngredientTransformer({ rowRef: op.ref });

      Object.values(candidateValues).forEach((value) => {
        if (isSavedRefGuard({ value })) {
          const savedRef = savedRefContract.parse(value);
          const savedRecordName = savedRef.name;
          if (!savedSoFar.has(savedRecordName)) {
            throw new HydrationSavedRecordMissingError({
              recipeName: plan.recipeName,
              ingredientName,
              savedRecordName,
              availableSavedRecordNames,
            });
          }
          if (savedRef.field !== undefined) {
            const producingConfig = savedRecordConfigs.get(savedRecordName);
            if (producingConfig !== undefined) {
              const recordSchema = producingConfig.record as AnyZodObjectSchema;
              const declaredFieldNames = Object.keys(recordSchema.shape);
              if (!declaredFieldNames.includes(savedRef.field)) {
                throw new HydrationSavedFieldMissingError({
                  recipeName: plan.recipeName,
                  ingredientName,
                  savedRecordName,
                  fieldName: savedRef.field,
                  declaredFieldNames,
                });
              }
            }
          }
        }
      });
    }

    if (op.op === 'saveRecord') {
      savedSoFar.add(op.name);
      const config = configByName.get(rowRefIngredientTransformer({ rowRef: op.ref }));
      if (config !== undefined) {
        savedRecordConfigs.set(op.name, config);
      }
    }
    if (op.op === 'filter') {
      savedRefCheckStack.push(...[...op.ops].reverse());
    }
  }

  // 3. LINKS — a row whose `links` no ancestor supplies, including one added at TOP LEVEL.
  // `linkValuesTransformer` is called with an empty `records` map on purpose: its `ok: false`
  // branch never reads `records` at all, only `ancestors` and `link.of`, so this reuses the same
  // pure rule the walk itself calls later rather than re-deriving it.
  const linksCheckStack: HydrationOp[] = [...plan.ops].reverse();
  for (let op = linksCheckStack.pop(); op !== undefined; op = linksCheckStack.pop()) {
    if (op.op === 'create') {
      const links = configByName.get(op.ingredient)?.links;
      if (links !== undefined && links.length > 0) {
        const linkResult = linkValuesTransformer({
          links,
          ancestors: op.ancestors,
          ownFields: op.fields,
          records: new Map(),
        });
        if (!linkResult.ok) {
          throw new HydrationUnlinkedRowError({
            recipeName: plan.recipeName,
            ingredientName: op.ingredient,
            missingParentName: linkResult.missingParentName,
          });
        }
      }
    }
    if (op.op === 'filter') {
      linksCheckStack.push(...[...op.ops].reverse());
    }
  }

  // 4. VERB — a chain call needs `query`, `update` or `remove` and the ingredient declares no
  // matching route (Q2's ruling). Folded first: a `filter`'s nested `set` never folds (it never
  // matches a top-level `create.ref`), and a top-level `set` that DOES fold away needs no `update`
  // route at all, so folding is what tells the two apart without re-deriving
  // `planFoldWritesTransformer`'s own condition here. Delegated to `verbCheckLayerBroker`, one node
  // at a time, so this function's own cyclomatic complexity stays under the enforced ceiling — see
  // that layer's own header.
  const folded = planFoldWritesTransformer({ plan });
  const verbCheckStack: HydrationOp[] = [...folded.ops].reverse();
  for (let op = verbCheckStack.pop(); op !== undefined; op = verbCheckStack.pop()) {
    verbCheckStack.push(...[...verbCheckLayerBroker({ op, plan, configByName })].reverse());
  }

  // 5. TRANSITIONS — a `set`'s transition asks for a `to` the ingredient does not reach by asking.
  // Both halves are known off the plan alone: `to` comes from the op, the reachable list from the
  // ingredient's own config — no live data is involved, so this refuses it here rather than leaving
  // it for the walk to hit mid-run with a row already written. The typed chain already refuses this
  // at the call site; this is the runtime half for a hand-built op or a plan assembled outside it,
  // exactly as `isReachableTransitionGuard`'s own PURPOSE describes.
  const transitionCheckStack: HydrationOp[] = [...plan.ops].reverse();
  for (let op = transitionCheckStack.pop(); op !== undefined; op = transitionCheckStack.pop()) {
    if (op.op === 'set' && op.transition !== undefined) {
      const ingredientName = rowRefIngredientTransformer({ rowRef: op.ref });
      const transitionSpec = configByName.get(ingredientName)?.transitions;
      if (
        transitionSpec !== undefined &&
        !isReachableTransitionGuard({ to: op.transition.to, spec: transitionSpec })
      ) {
        throw new HydrationTransitionUnreachableError({
          recipeName: plan.recipeName,
          ingredientName,
          to: String(op.transition.to),
          reachableStates: transitionSpec.to.map((state) => String(state)),
        });
      }
    }
    if (op.op === 'filter') {
      transitionCheckStack.push(...[...op.ops].reverse());
    }
  }

  // 6. REMOVED REFS — once a row is removed, no further verbs may target it (`remove`, `set`,
  // `saveRecordAs`, or extra verbs). Walking in declaration order catches verbs attempted on an
  // already-removed row handle before anything runs.
  const removedRefs = new Set<RowRef>();
  const removedRefCheckStack: HydrationOp[] = [...plan.ops].reverse();
  const verbByOp: Record<string, string> = {
    remove: 'remove',
    set: 'set',
    saveRecord: 'saveRecordAs',
  };
  for (let op = removedRefCheckStack.pop(); op !== undefined; op = removedRefCheckStack.pop()) {
    if (op.op === 'filter') {
      removedRefCheckStack.push(...[...op.ops].reverse());
    } else {
      const verb = op.op === 'extra' ? op.verb : verbByOp[op.op];
      if (verb !== undefined) {
        if (removedRefs.has(op.ref)) {
          const ingredientName = rowRefIngredientTransformer({ rowRef: op.ref });
          throw new HydrationRemovedHandleVerbError({
            recipeName: plan.recipeName,
            ingredientName,
            ref: op.ref,
            verb,
          });
        }
        if (op.op === 'remove') {
          removedRefs.add(op.ref);
        }
      }
    }
  }

  return routePlanContract.parse(routePlan);
};
