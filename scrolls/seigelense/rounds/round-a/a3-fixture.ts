/**
 * Scratch fixture for round-A case A3 — `fields` NARROWER than the real entity. Not part of the
 * committed type-fixture suite; lives under tmp/ for a one-off tier-2 compiler check.
 */
import { z } from 'zod';
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { questFieldsContract, questRecordContract, guildIngredient } from '../../packages/hydration/test/type-fixtures/dm-target';
import type {
  IngredientConfig,
  IngredientConfigInferenceAnchor,
  Ingredient,
  ExtrasFree,
} from '../../packages/hydration/src/contracts/ingredient-config/ingredient-config-contract';
import type { CopiesFor } from '../../packages/hydration/src/contracts/hydration-routes/hydration-routes-contract';
import type { DmTarget } from '../../packages/hydration/test/type-fixtures/dm-target';

declare const hydrate: (args: { target: DmTarget; fields: Record<string, unknown> }) => Promise<unknown>;

const dmIngredient = <TFields extends object, const C extends IngredientConfig<DmTarget, TFields>>(
  config: C &
    IngredientConfigInferenceAnchor<TFields> &
    CopiesFor<C['routes']> & { extras?: ExtrasFree<C['extras']> },
): Ingredient<C> => ingredientDeclareBroker<DmTarget, TFields, C['name'], C>(config);

// NARROWER: omits `userRequest`, a field the real quest entity has.
const narrowQuestFieldsContract = questFieldsContract.omit({ userRequest: true });
type NarrowQuestFields = z.infer<typeof narrowQuestFieldsContract>;
const narrowQuestFields: z.ZodType<
  NarrowQuestFields,
  z.ZodTypeDef,
  z.input<typeof narrowQuestFieldsContract>
> = narrowQuestFieldsContract;

const narrowQuestIngredient = dmIngredient({
  name: 'narrow-quest',
  description: 'a quest-shaped ingredient whose fields omit userRequest',
  fields: narrowQuestFields,
  record: questRecordContract.omit({ status: true }),
  links: [{ of: 'guild', as: 'guildId' }],
  routes: { write: async ({ target, fields }) => hydrate({ target, fields }) },
  copies: 'x',
});

const dm = entryChainTransformer({
  registry: { guilds: guildIngredient, quests: narrowQuestIngredient },
});

// The call a real questIngredient would accept — set on `userRequest` — which this NARROWER
// ingredient's own fields contract no longer has.
export const narrowFieldsCallSite = dm.guilds.add(1, (g) => [
  g[0].quests.add(1, (q) => [q[0].set({ userRequest: 'seeded' })]),
]);
