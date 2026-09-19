/**
 * PURPOSE: `guildFieldsContract`, upcast to zod's own abstract `z.ZodType<GuildFields>` rather than
 * left as the concrete `ZodObject<Shape>` it infers to. Reach for this over `guildFieldsContract`
 * itself wherever a caller hands `fields` to `ingredient({...})`: `IngredientConfig['fields']` and
 * `IngredientConfigInferenceAnchor['fields']` both type `fields` as `{ readonly _output: TFields }`,
 * and `ingredient()`'s generic signature intersects both constraints onto the SAME config value —
 * re-checking one CONCRETE `ZodObject<Shape>` against two independently-inferred phantom-carrier
 * sites routes the comparison through `ZodObject`'s own generic methods (`deepPartial()` among
 * them) and fails with a `deepPartial()`-incompatibility error for a shape holding branded fields,
 * even though the schema itself is perfectly valid — `ingredient-config-contract.ts`'s own header
 * names this failure and its fix: widen `fields` to `z.ZodType<InferredFields>` at the declaration
 * site so only ONE concrete class ever needs comparing against `_output`. `guildFieldsContract`
 * itself stays a `ZodObject` — `guild-ingredient-broker.ts`'s `defaults` reads
 * `guildFieldsContract.shape.<field>`, which an upcast export would lose.
 *
 * USAGE:
 * ingredient({ fields: guildFieldsSchemaContract, ... });
 * // Same runtime schema as guildFieldsContract; parses and fails exactly the same
 */
import type { z } from 'zod';

import { guildFieldsContract } from '../guild-fields/guild-fields-contract';
import type { GuildFields } from '../guild-fields/guild-fields-contract';

export const guildFieldsSchemaContract: z.ZodType<
  GuildFields,
  z.ZodTypeDef,
  z.input<typeof guildFieldsContract>
> = guildFieldsContract;
