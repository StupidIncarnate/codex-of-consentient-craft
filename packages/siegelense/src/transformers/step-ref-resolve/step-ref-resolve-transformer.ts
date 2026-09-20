/**
 * PURPOSE: Resolves one `{step.row.field}` reference against the steps a run has named with `as:`
 * so far — the map of every earlier step's own output, each keyed by the row names its plan saved.
 * `seed.params` and `goto.path` are the only two places a reference is allowed to appear
 * (siegelense-recipes.md:2102-2112); this function only answers what one resolves to, or why it
 * cannot, entirely from data already in hand — the caller decides where to look for one. The
 * resolved value renders as `ContentText` rather than the field's own raw type: every field a
 * reference has ever named in this grammar is an id, a slug or a path, and a transformer may not
 * return `unknown`.
 *
 * USAGE:
 * stepRefResolveTransformer({
 *   ref: '{g.guild.id}',
 *   outputs: { g: { guild: { id: 'g_1', urlSlug: 'the-guild' } } },
 * });
 * // Returns 'g_1' as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { stepRefContract } from '../../contracts/step-ref/step-ref-contract';
import { StepRefUnresolvedError } from '../../errors/step-ref-unresolved/step-ref-unresolved-error';
import { stepRefStatics } from '../../statics/step-ref/step-ref-statics';

const BRACE_SHAPE = /^\{(.+)\}$/u;

export const stepRefResolveTransformer = ({
  ref,
  outputs,
}: {
  ref: string;
  outputs: Record<PropertyKey, Record<PropertyKey, unknown>>;
}): ContentText => {
  const parsed = stepRefContract.safeParse(ref);

  if (!parsed.success) {
    const inner = BRACE_SHAPE.exec(ref)?.[1] ?? '';
    const rawSegments = inner.split('.');
    if (rawSegments.length === stepRefStatics.mistakes.stepFieldSegmentCount) {
      const step = rawSegments[0] ?? '';
      const savedRows = outputs[step];
      if (savedRows !== undefined) {
        throw new StepRefUnresolvedError({
          ref,
          reason: 'two-segment',
          step,
          row: null,
          field: null,
          available: Object.keys(savedRows),
        });
      }
      throw new StepRefUnresolvedError({
        ref,
        reason: 'unknown-step',
        step,
        row: null,
        field: null,
        available: Object.keys(outputs),
      });
    }
    throw parsed.error;
  }

  const { step, row, field } = parsed.data;

  const rowRecord = outputs[step];
  if (rowRecord === undefined) {
    throw new StepRefUnresolvedError({
      ref,
      reason: 'unknown-step',
      step,
      row: null,
      field: null,
      available: Object.keys(outputs),
    });
  }

  const record = rowRecord[row];
  if (record === undefined) {
    throw new StepRefUnresolvedError({
      ref,
      reason: 'unknown-row',
      step,
      row,
      field: null,
      available: Object.keys(rowRecord),
    });
  }

  if (typeof record !== 'object' || record === null) {
    throw new StepRefUnresolvedError({
      ref,
      reason: 'unknown-field',
      step,
      row,
      field,
      available: [],
    });
  }

  const fields = record as Record<PropertyKey, unknown>;
  const value = fields[field];
  if (value === undefined) {
    throw new StepRefUnresolvedError({
      ref,
      reason: 'unknown-field',
      step,
      row,
      field,
      available: Object.keys(fields),
    });
  }

  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return contentTextContract.parse(text);
};
