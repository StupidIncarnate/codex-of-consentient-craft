import type { StubArgument } from '@dungeonmaster/shared/@types';
import { z } from 'zod';
import { ingredientConfigContract } from './ingredient-config-contract';
import type { IngredientConfigData } from './ingredient-config-contract';

const DEFAULT_FIELDS_SCHEMA = z.object({ title: z.string().brand<'QuestFieldTitle'>() });
const DEFAULT_RECORD_SCHEMA = z.object({
  id: z.string().brand<'QuestRecordId'>(),
  title: z.string().brand<'QuestFieldTitle'>(),
});

export const IngredientConfigStub = ({
  ...props
}: StubArgument<IngredientConfigData> = {}): IngredientConfigData =>
  ingredientConfigContract.parse({
    name: 'quest',
    description: 'one quest under a guild, at whatever status you set it to',
    fields: DEFAULT_FIELDS_SCHEMA,
    record: DEFAULT_RECORD_SCHEMA,
    routes: { write: (): unknown => undefined },
    copies: 'questPersistBroker',
    ...props,
  });
