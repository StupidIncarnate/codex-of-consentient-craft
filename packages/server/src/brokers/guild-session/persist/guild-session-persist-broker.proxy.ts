import { orchestratorGetGuildAdapterProxy } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter.proxy';
import { orchestratorUpdateGuildAdapterProxy } from '../../../adapters/orchestrator/update-guild/orchestrator-update-guild-adapter.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildStub } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;

export const guildSessionPersistBrokerProxy = (): {
  setupGuildFound: (params: { guild: Guild }) => void;
  setupGetGuildThrows: (params: { error: Error }) => void;
  setupUpdateReturns: (params: { guild: Guild }) => void;
  setupUpdateThrows: (params: { error: Error }) => void;
  getUpdateCallArgs: () => unknown[];
} => {
  const getGuildProxy = orchestratorGetGuildAdapterProxy();
  const updateGuildProxy = orchestratorUpdateGuildAdapterProxy();
  processDevLogAdapterProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-02-14T00:00:00.000Z');

  return {
    setupGuildFound: ({ guild }: { guild: Guild }): void => {
      getGuildProxy.returns({ guild });
    },
    setupGetGuildThrows: ({ error }: { error: Error }): void => {
      getGuildProxy.throws({ error });
    },
    setupUpdateReturns: ({ guild }: { guild: Guild }): void => {
      updateGuildProxy.returns({ guild });
    },
    setupUpdateThrows: ({ error }: { error: Error }): void => {
      updateGuildProxy.throws({ error });
    },
    getUpdateCallArgs: (): unknown[] =>
      jest.mocked(StartOrchestrator.updateGuild).mock.calls.flat(),
  };
};
