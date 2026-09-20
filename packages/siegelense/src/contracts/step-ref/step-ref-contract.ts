/**
 * PURPOSE: The `{step.row.field}` grammar a batch reads a seed's minted ids back through — three
 * segments, always (siegelense-recipes.md:2102). Reach for this over parsing a reference by hand
 * wherever a step field admits one, so every caller refuses a malformed shape the same way. Admitted
 * on `goto.path` and `seed.params` only, never generalised to every string field: an `eval` step's
 * `source` is JavaScript, and this brace pattern is reachable in real JavaScript source, so parsing
 * it there would rewrite a caller's code without being asked.
 *
 * USAGE:
 * stepRefContract.parse('{g.guild.id}');
 * // Returns { step: 'g', row: 'guild', field: 'id' } as branded StepRef
 */

import { z } from 'zod';

import { stepOutputNameContract } from '../step-output-name/step-output-name-contract';
import { stepRefStatics } from '../../statics/step-ref/step-ref-statics';

const STEP_REF_SHAPE = /^\{(.+)\}$/u;

export const stepRefContract = z
  .string()
  .transform((raw, ctx) => {
    const match = STEP_REF_SHAPE.exec(raw);
    if (match === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `"${raw}" is not a step reference — a reference is wrapped in braces: {step.row.field}.`,
      });
      return z.NEVER;
    }

    const segments = (match[1] ?? '').split('.');
    if (
      segments.length !== stepRefStatics.grammar.segmentCount ||
      segments.some((segment) => segment.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Step reference "${raw}" has ${String(segments.length)} segment(s) (${segments.join('.')}) — a step reference always has three: {step.row.field}.`,
      });
      return z.NEVER;
    }

    return { step: segments[0], row: segments[1], field: segments[2] };
  })
  .pipe(
    z.object({
      step: stepOutputNameContract,
      row: z.string().min(1).brand<'StepRefRow'>(),
      field: z.string().min(1).brand<'StepRefField'>(),
    }),
  )
  .brand<'StepRef'>();

export type StepRef = z.infer<typeof stepRefContract>;
