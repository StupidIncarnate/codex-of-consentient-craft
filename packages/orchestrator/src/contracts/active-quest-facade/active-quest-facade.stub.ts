import type { StubArgument } from '@dungeonmaster/shared/@types';

import { activeQuestFacadeContract } from './active-quest-facade-contract';
import type { ActiveQuestFacade } from './active-quest-facade-contract';

export const ActiveQuestFacadeStub = ({
  ...props
}: StubArgument<ActiveQuestFacade> = {}): ActiveQuestFacade => {
  const { setActive, clear, ...dataProps } = props;

  return {
    ...activeQuestFacadeContract.parse(dataProps),
    setActive: setActive ?? ((): void => undefined),
    clear: clear ?? ((): void => undefined),
  };
};
