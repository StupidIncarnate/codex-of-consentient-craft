/**
 * PURPOSE: `questFieldsContract`, upcast to zod's own abstract `z.ZodType<QuestFields>` rather than
 * left as the concrete `ZodObject<Shape>` it infers to. Reach for this over `questFieldsContract`
 * itself wherever a caller hands `fields` to `ingredient({...})`: `IngredientConfig['fields']` and
 * `IngredientConfigInferenceAnchor['fields']` both type `fields` as `{ readonly _output: TFields }`,
 * and `ingredient()`'s generic signature intersects both constraints onto the SAME config value —
 * re-checking one CONCRETE `ZodObject<Shape>` against two independently-inferred phantom-carrier
 * sites routes the comparison through `ZodObject`'s own generic methods (`deepPartial()` among
 * them) and fails with a `deepPartial()`-incompatibility error for a shape holding branded fields,
 * even though the schema itself is perfectly valid — `ingredient-config-contract.ts`'s own header
 * names this failure and its fix: widen `fields` to `z.ZodType<InferredFields>` at the declaration
 * site so only ONE concrete class ever needs comparing against `_output`. The quest ingredient is
 * the first in this repo to declare `transitions`, which is what first exercises this comparison —
 * no ingredient without `transitions` has needed this widening.
 *
 * USAGE:
 * ingredient({ fields: questFieldsSchemaContract, ... });
 * // Same runtime schema as questFieldsContract; parses and fails exactly the same
 */
import type { z } from 'zod';

import { questFieldsContract } from '../quest-fields/quest-fields-contract';
import type { QuestFields } from '../quest-fields/quest-fields-contract';

export const questFieldsSchemaContract: z.ZodType<
  QuestFields,
  z.ZodTypeDef,
  z.input<typeof questFieldsContract>
> = questFieldsContract;
