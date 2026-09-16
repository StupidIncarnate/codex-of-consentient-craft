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
 * site so only ONE concrete class ever needs comparing against `_output`. Every multi-field
 * `ZodObject` handed to `ingredient({fields: ...})` needs this widening, regardless of whether that
 * ingredient declares `transitions` — `session-fields-contract.ts` and `subagent-fields-contract.ts`
 * carry the identical upcast inline in their own export, and `guild-fields-schema-contract.ts` /
 * `operation-fields-schema-contract.ts` apply the same fix as a sibling file, for ingredients that
 * declare no `transitions` either.
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
