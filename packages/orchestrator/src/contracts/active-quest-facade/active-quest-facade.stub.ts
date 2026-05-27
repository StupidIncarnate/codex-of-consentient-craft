import type { StubArgument } from '@dungeonmaster/shared/@types';

import { activeQuestFacadeContract } from './active-quest-facade-contract';
import type { ActiveQuestFacade } from './active-quest-facade-contract';

export const ActiveQuestFacadeStub = ({
  ...props
}: StubArgument<ActiveQuestFacade> = {}): ActiveQuestFacade =>
  activeQuestFacadeContract.parse({
    setActive: () => undefined,
    clear: () => undefined,
    ...props,
  });
