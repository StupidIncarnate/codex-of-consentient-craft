import { registryCreateBroker } from '@dungeonmaster/hydration/brokers';
import { guildIngredient, questIngredient, operationIngredient, sessionIngredient } from '../../packages/hydration/test/type-fixtures/dm-target';

const dm = registryCreateBroker({
  guilds: guildIngredient,
  quests: questIngredient,
  operations: operationIngredient,
  sessions: sessionIngredient,
});
console.log('OK', Object.keys(dm).sort());
