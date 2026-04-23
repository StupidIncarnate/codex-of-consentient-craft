import type { FilePath, GuildConfig, GuildListItem } from '@dungeonmaster/shared/contracts';
import type { Dirent } from 'fs';

import { questOrchestrationLoopBrokerProxy } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy';
import { smoketestEnsureGuildBrokerProxy } from '../../../brokers/smoketest/ensure-guild/smoketest-ensure-guild-broker.proxy';
import { smoketestRunOrchestrationCaseBrokerProxy } from '../../../brokers/smoketest/run-orchestration-case/smoketest-run-orchestration-case-broker.proxy';
import { smoketestRunSingleAgentCaseBrokerProxy } from '../../../brokers/smoketest/run-single-agent-case/smoketest-run-single-agent-case-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { smoketestRunStateProxy } from '../../../state/smoketest-run/smoketest-run-state.proxy';
import { smoketestScenarioStateProxy } from '../../../state/smoketest-scenario/smoketest-scenario-state.proxy';

export const SmoketestRunResponderProxy = (): {
  setupEnsuredGuildPresent: (params: {
    config: GuildConfig;
    homeDir: string;
    homePath: FilePath;
    guildEntries: readonly {
      accessible: boolean;
      questsDirPath: FilePath;
      questDirEntries: Dirent[];
    }[];
  }) => void;
  findMatchingGuildByName: (params: {
    guilds: readonly GuildListItem[];
    name: string;
  }) => GuildListItem | undefined;
} => {
  smoketestRunSingleAgentCaseBrokerProxy();
  smoketestRunOrchestrationCaseBrokerProxy();
  const ensureGuildProxy = smoketestEnsureGuildBrokerProxy();
  questOrchestrationLoopBrokerProxy();
  orchestrationEventsStateProxy();
  orchestrationProcessesStateProxy();
  smoketestRunStateProxy();
  smoketestScenarioStateProxy();

  return {
    setupEnsuredGuildPresent: ({
      config,
      homeDir,
      homePath,
      guildEntries,
    }: {
      config: GuildConfig;
      homeDir: string;
      homePath: FilePath;
      guildEntries: readonly {
        accessible: boolean;
        questsDirPath: FilePath;
        questDirEntries: Dirent[];
      }[];
    }): void => {
      ensureGuildProxy.setupGuildPresent({ config, homeDir, homePath, guildEntries });
    },
    findMatchingGuildByName: ensureGuildProxy.findMatchingGuildByName,
  };
};
