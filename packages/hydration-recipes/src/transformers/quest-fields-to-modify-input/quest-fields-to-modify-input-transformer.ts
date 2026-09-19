/**
 * PURPOSE: Narrows a quest ingredient row's `fields` down to the subset `modifyQuestInputContract`
 * recognizes, so the `update` route can hand it straight to `questModifyBroker`. Reach for this
 * over spreading `fields` directly: `modifyQuestInputContract` is `.strict()`, so a caller's
 * `set({ guildId })` or `set({ userRequest })` — both real `QuestFields` keys, neither writable
 * through modify-quest — would throw a raw ZodError instead of the field simply being ignored.
 *
 * USAGE:
 * questFieldsToModifyInputTransformer({ questId, fields: { title: 'renamed', guildId: 'g1' } });
 * // Returns { questId, title: 'renamed' } — guildId dropped, questId branded
 */
import { modifyQuestInputContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput, QuestId } from '@dungeonmaster/shared/contracts';

import { modifiableQuestFieldsStatics } from '../../statics/modifiable-quest-fields/modifiable-quest-fields-statics';

export const questFieldsToModifyInputTransformer = ({
  questId,
  fields,
}: {
  questId: QuestId;
  fields: Record<string, unknown>;
}): ModifyQuestInput => {
  // `fields` keys are plain `string` (an arbitrary caller-supplied record), narrower than
  // `modifiableQuestFieldsStatics.names`'s literal union — `.some(...===...)` compares by value
  // instead of by `Set.has`/`Array.includes`, which both reject a `string` argument against that
  // narrower parameter type at compile time.
  const modifiable = Object.fromEntries(
    Object.entries(fields).filter(([key]) =>
      modifiableQuestFieldsStatics.names.some((name) => name === key),
    ),
  );

  return modifyQuestInputContract.parse({
    ...modifiable,
    questId: questIdContract.parse(questId),
  });
};
