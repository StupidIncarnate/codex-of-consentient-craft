/**
 * PURPOSE: Test proxy for SiegelenseStartResponder — mocks `instanceStartBroker` and
 * `questOwningGuildFindBroker` directly rather than composing their own child proxies' staging,
 * matching `SiegelenseStatusResponderProxy`'s shape for the sibling command.
 * `instanceStartBrokerProxy` and `questOwningGuildFindBrokerProxy` are still constructed (never
 * addressed further) to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseStartResponderProxy();
 * proxy.stageManifest({ manifest });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';

import type { RecipeName } from '../../../contracts/recipe-name/recipe-name-contract';

import { instanceStartBroker } from '../../../brokers/instance/start/instance-start-broker';
import { instanceStartBrokerProxy } from '../../../brokers/instance/start/instance-start-broker.proxy';
import { questOwningGuildFindBroker } from '../../../brokers/quest/owning-guild-find/quest-owning-guild-find-broker';
import { questOwningGuildFindBrokerProxy } from '../../../brokers/quest/owning-guild-find/quest-owning-guild-find-broker.proxy';
import type { InstanceManifestStub } from '../../../contracts/instance-manifest/instance-manifest.stub';
import type { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';

type InstanceManifest = ReturnType<typeof InstanceManifestStub>;
type SpecName = ReturnType<typeof SpecNameStub>;

export const SiegelenseStartResponderProxy = (): {
  stageManifest: (params: { manifest: InstanceManifest }) => void;
  stageError: (params: { error: Error }) => void;
  stageQuestResolvesToGuild: (params: { questId: QuestId; guildId: GuildId }) => void;
  stageQuestUnresolvable: (params: { questId: QuestId; error: Error }) => void;
  getStdoutWrites: () => unknown[];
  getStartCallsMatching: (params: {
    specName: SpecName;
    questId: QuestId | null;
    guildId: GuildId | null;
    seed: RecipeName | null;
  }) => unknown[][];
  getOwningGuildFindCallsMatching: (params: { questId: QuestId }) => unknown[][];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages instanceStartBroker and
  // questOwningGuildFindBroker directly below, never through their own setup methods.
  instanceStartBrokerProxy();
  questOwningGuildFindBrokerProxy();

  const instanceStartHandle = registerMock({ fn: instanceStartBroker });
  const owningGuildFindHandle = registerMock({ fn: questOwningGuildFindBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageManifest: ({ manifest }: { manifest: InstanceManifest }): void => {
      instanceStartHandle.calledWith([]).resolves(manifest);
    },

    stageError: ({ error }: { error: Error }): void => {
      instanceStartHandle.calledWith([]).rejects(error);
    },

    stageQuestResolvesToGuild: ({
      questId,
      guildId,
    }: {
      questId: QuestId;
      guildId: GuildId;
    }): void => {
      owningGuildFindHandle.calledWith([{ questId }]).resolves(guildId);
    },

    stageQuestUnresolvable: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      owningGuildFindHandle.calledWith([{ questId }]).rejects(error);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),

    getStartCallsMatching: ({
      specName,
      questId,
      guildId,
      seed,
    }: {
      specName: SpecName;
      questId: QuestId | null;
      guildId: GuildId | null;
      seed: RecipeName | null;
    }): unknown[][] => instanceStartHandle.callsMatching([{ specName, questId, guildId, seed }]),

    getOwningGuildFindCallsMatching: ({ questId }: { questId: QuestId }): unknown[][] =>
      owningGuildFindHandle.callsMatching([{ questId }]),
  };
};
