/**
 * PURPOSE: Brings one EXISTING row into scope — queries the ingredient's own `query` route for
 * `op.where`, requires EXACTLY one match, and binds it onto `op.ref` the same way
 * `opCreateApplyLayerBroker` binds a row it just minted. Reach for this over `opFilterApplyLayerBroker`
 * whenever the row must be addressable at a REAL `ref` for later top-level ops (a child `add`, an
 * extra, a `saveRecordAs`) rather than replayed as a filter's own nested subtree — a `filter`'s
 * `matchedRef` is a placeholder the runner rebinds once per matched row and is never `state.saved`-
 * able the way a `create`'s (or this op's) `ref` is.
 *
 * A zero- or multi-row match is `HydrationFilterExpectationError` with `expect: 'one'` fixed —
 * attach always binds a SINGLE row, so there is no `expect` for a caller to choose. A query that
 * THROWS is `HydrationQueryFailedError`, the same distinction `opFilterApplyLayerBroker`'s own
 * header draws: the app was unreachable, not merely empty-handed. The matched record is parsed
 * through the ingredient's own `record` contract, exactly as a `create` route's answer is — unlike
 * `opFilterApplyLayerBroker`, which never validates a matched row's shape, because THIS row's ref
 * becomes a first-class handle a recipe may `saveRecordAs` and build children off, and its static
 * type already promises `RecordOf<I>`.
 *
 * USAGE:
 * await opAttachApplyLayerBroker({ op, target, config, state });
 * // Returns the mutated state, with state.records.get(op.ref) now holding the matched, parsed record
 */
import { fieldValuesResolveTransformer } from '../../../transformers/field-values-resolve/field-values-resolve-transformer';
import { HydrationQueryFailedError } from '../../../errors/hydration-query-failed/hydration-query-failed-error';
import { HydrationFilterExpectationError } from '../../../errors/hydration-filter-expectation/hydration-filter-expectation-error';
import { HydrationRecordShapeError } from '../../../errors/hydration-record-shape/hydration-record-shape-error';
import type { OpAttach } from '../../../contracts/op-attach/op-attach-contract';
import type { HydrationTarget } from '../../../contracts/hydration-target/hydration-target-contract';
import type {
  IngredientConfigData,
  AnyZodSchema,
} from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { HydrationRunState } from '../../../contracts/hydration-run-state/hydration-run-state-contract';

const UNKNOWN_FIELD = '(root)';
const EXPECT_ONE = 'one';

export const opAttachApplyLayerBroker = async ({
  op,
  target,
  config,
  state,
}: {
  op: OpAttach;
  target: HydrationTarget;
  config: IngredientConfigData;
  state: HydrationRunState;
}): Promise<HydrationRunState> => {
  const resolvedWhere = fieldValuesResolveTransformer({ values: op.where, saved: state.saved });

  const matchedRecords: readonly unknown[] = await (async (): Promise<readonly unknown[]> => {
    try {
      const rawMatches = await config.routes.query?.({ target, where: resolvedWhere });
      return Array.isArray(rawMatches) ? rawMatches : [];
    } catch (cause) {
      throw new HydrationQueryFailedError({
        recipeName: state.recipeName,
        ingredientName: op.ingredient,
        where: JSON.stringify(resolvedWhere),
        cause,
      });
    }
  })();

  if (matchedRecords.length !== 1) {
    throw new HydrationFilterExpectationError({
      recipeName: state.recipeName,
      ingredientName: op.ingredient,
      where: JSON.stringify(resolvedWhere),
      expect: EXPECT_ONE,
      matchedCount: matchedRecords.length,
      candidates: matchedRecords,
    });
  }

  const [matchedRecord] = matchedRecords;
  const recordSchema = config.record as AnyZodSchema;
  const parsedRecord = recordSchema.safeParse(matchedRecord);
  if (!parsedRecord.success) {
    const [firstIssue] = parsedRecord.error.issues;
    throw new HydrationRecordShapeError({
      recipeName: state.recipeName,
      ingredientName: op.ingredient,
      route: 'query',
      fieldName:
        firstIssue === undefined ? UNKNOWN_FIELD : String(firstIssue.path[0] ?? UNKNOWN_FIELD),
      validationMessage: firstIssue === undefined ? 'Required' : firstIssue.message,
    });
  }

  state.records.set(op.ref, parsedRecord.data);
  return state;
};
