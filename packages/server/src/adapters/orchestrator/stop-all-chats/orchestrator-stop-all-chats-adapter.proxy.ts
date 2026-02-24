jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorStopAllChatsAdapterProxy = (): Record<PropertyKey, never> => {
  jest.mocked(StartOrchestrator.stopAllChats).mockReturnValue(undefined);

  return {};
};
