import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsGuildQuestsPathFindBrokerProxy } from '../guild-quests-path-find/locations-guild-quests-path-find-broker.proxy';

export const locationsQuestFolderPathFindBrokerProxy = (): {
  setupQuestFolderPath: (params: {
    homeDir: string;
    homePath: string;
    guildPath: string;
    guildQuestsPath: string;
    questFolderPath: string;
  }) => void;
} => {
  const guildQuestsProxy = locationsGuildQuestsPathFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. The broker's own call is `join(guildQuestsPath, questId)`, but
  // this proxy's public shape carries no `questId` param — a cross-package consumer
  // (siegelense's locations-citation-quest-file-path-find-broker.proxy.ts) composes it and must
  // keep typechecking against the existing signature — so `questId` is recovered the same way
  // variant-walk-layer-broker.proxy.ts recovers its own missing segment: sliced off the known
  // questFolderPath using the known guildQuestsPath prefix.
  const joinHandle = registerMock({ fn: join });

  return {
    setupQuestFolderPath: ({
      homeDir,
      homePath,
      guildPath,
      guildQuestsPath,
      questFolderPath,
    }: {
      homeDir: string;
      homePath: string;
      guildPath: string;
      guildQuestsPath: string;
      questFolderPath: string;
    }): void => {
      guildQuestsProxy.setupGuildQuestsPath({ homeDir, homePath, guildPath, guildQuestsPath });
      const questId = questFolderPath.slice(guildQuestsPath.length + 1);
      joinHandle.calledWith([guildQuestsPath, questId]).returns(questFolderPath);
    },
  };
};
