/**
 * Row 3, re-proven against the REAL quest ingredient (`@dungeonmaster/siegelense-recipes`), not
 * only the fixture stand-in `dm-target.ts` provides. `blocked` is a real `QuestStatus`
 * `questIngredientBroker` deliberately leaves off `transitions.to` (see that file's own header for
 * why) — this is the specification's own headline claim, word for word: "`to` being narrower is the
 * point ... `set({ status: 'blocked' })` does not compile." Without this fixture the negative type
 * suite proves the rule only against a stand-in nobody ships.
 */
import { entryChainTransformer } from '../../../src/transformers/entry-chain/entry-chain-transformer';
import { questIngredientBroker } from '@dungeonmaster/siegelense-recipes/brokers';

const dm = entryChainTransformer({ registry: { quests: questIngredientBroker } });

export const realQuestUnreachableStatus = dm.quests.add(1, (q) => [
  q[0].set({ status: 'blocked' }),
]);
