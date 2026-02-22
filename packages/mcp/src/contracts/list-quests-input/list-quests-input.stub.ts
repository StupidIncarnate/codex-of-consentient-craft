import type { StubArgument } from '@dungeonmaster/shared/@types';

import { listQuestsInputContract } from './list-quests-input-contract';
import type { ListQuestsInput } from './list-quests-input-contract';

export const ListQuestsInputStub = ({
  ...props
}: StubArgument<ListQuestsInput> = {}): ListQuestsInput =>
  listQuestsInputContract.parse({
    guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ...props,
  });
