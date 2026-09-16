/**
 * PURPOSE: One `dmIngredient`-shaped wrapper, and one minimal fields/record contract, reused by
 * every fixture in this directory so each fixture file is nothing but its own ONE deliberate
 * error. `dmIngredient` is the identical generic-binding trick `../dm-target.ts`'s own
 * (unexported) `dmIngredient` uses — duplicated here rather than imported, because that binding is
 * private to that module and this directory may not edit it. The fields/record contracts are
 * DELIBERATELY NOT `dm-target.ts`'s own `questFieldsContract` — a diagnostic message embeds the
 * whole compared type, so reusing quest's four-field shape would put every fixture's expected
 * message at the mercy of an edit to a file outside this directory. Carries no deliberate error
 * itself: `typescriptProgramDiagnosticsAdapter` resolves it as an ordinary import of whichever
 * fixture pulls it in, so a mistake here would contaminate every fixture's diagnostic count
 * rather than staying isolated to one file.
 *
 * USAGE:
 * import { dmIngredient, sampleFields, sampleRecordContract, write, walk } from './_shared';
 */
import { z } from 'zod';
import { ingredientDeclareBroker } from '../../../src/brokers/ingredient/declare/ingredient-declare-broker';
import type {
  IngredientConfig,
  IngredientConfigInferenceAnchor,
  Ingredient,
  ExtrasFree,
} from '../../../src/contracts/ingredient-config/ingredient-config-contract';
import type { CopiesFor } from '../../../src/contracts/hydration-routes/hydration-routes-contract';
import type { DmTarget } from '../dm-target';

const sampleTitleContract = z.string().brand<'SampleTitle'>();
const sampleIdContract = z.string().brand<'SampleId'>();

export const sampleFieldsContract = z.object({
  title: sampleTitleContract,
  status: z.enum(['queued', 'accepted', 'underway', 'stalled', 'finished']),
});

export type SampleFields = z.infer<typeof sampleFieldsContract>;

// See `dm-target.ts`'s own `questFields` comment: widened to the base `z.ZodType`, all three type
// arguments given, so a concrete `ZodObject` is checked against `_output` once rather than through
// two independently-inferred sites.
export const sampleFields: z.ZodType<
  SampleFields,
  z.ZodTypeDef,
  z.input<typeof sampleFieldsContract>
> = sampleFieldsContract;

export const sampleRecordContract = z.object({
  id: sampleIdContract,
  title: sampleFieldsContract.shape.title,
  status: sampleFieldsContract.shape.status,
});

export const dmIngredient = <
  TFields extends object,
  const C extends IngredientConfig<DmTarget, TFields>,
>({
  ...config
}: C &
  IngredientConfigInferenceAnchor<TFields> &
  CopiesFor<C['routes']> & { extras?: ExtrasFree<C['extras']> }): Ingredient<C> =>
  ingredientDeclareBroker<DmTarget, TFields, C['name'], C>(config);

export declare const write: (args: {
  target: DmTarget;
  fields: Record<string, unknown>;
}) => Promise<unknown>;

export declare const walk: (args: {
  from: unknown;
  to: unknown;
  target: DmTarget;
  record: Record<string, unknown>;
}) => unknown;
