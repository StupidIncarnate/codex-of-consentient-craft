/**
 * PURPOSE: Test proxy for SiegelenseStartResponder — mocks `instanceStartBroker`,
 * `questOwningGuildFindBroker` and `recipesReadBroker` directly rather than composing their own
 * child proxies' staging, matching `SiegelenseStatusResponderProxy`'s shape for the sibling command.
 * `instanceStartBrokerProxy`, `questOwningGuildFindBrokerProxy` and `recipesReadBrokerProxy` are
 * still constructed (never addressed further) to satisfy `enforce-proxy-child-creation`.
 * `recipesReadBroker` gets a STICKY, permissive constructor-level default (`resolves([])`) — an
 * empty listing never matches any `--seed` recipe name, so every scenario that never calls
 * `stageRecipeListing` still exercises the responder's real "no matching entry, proceed as before"
 * branch instead of hitting `registerMock`'s unstaged-call throw.
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
import { recipesReadBroker } from '../../../brokers/recipes/read/recipes-read-broker';
import { recipesReadBrokerProxy } from '../../../brokers/recipes/read/recipes-read-broker.proxy';
import type { InstanceManifestStub } from '../../../contracts/instance-manifest/instance-manifest.stub';
import type { RecipeListingEntryStub } from '../../../contracts/recipe-listing-entry/recipe-listing-entry.stub';
import type { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';

type InstanceManifest = ReturnType<typeof InstanceManifestStub>;
type SpecName = ReturnType<typeof SpecNameStub>;
type RecipeListingEntry = ReturnType<typeof RecipeListingEntryStub>;

export const SiegelenseStartResponderProxy = (): {
  stageManifest: (params: { manifest: InstanceManifest }) => void;
  stageError: (params: { error: Error }) => void;
  stageQuestResolvesToGuild: (params: { questId: QuestId; guildId: GuildId }) => void;
  stageQuestUnresolvable: (params: { questId: QuestId; error: Error }) => void;
  stageRecipeListing: (params: { entries: readonly RecipeListingEntry[] }) => void;
  getStdoutWrites: () => unknown[];
  getStartCallsMatching: (params: {
    specName: SpecName;
    questId: QuestId | null;
    guildId: GuildId | null;
    seed: RecipeName | null;
  }) => unknown[][];
  getOwningGuildFindCallsMatching: (params: { questId: QuestId }) => unknown[][];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages instanceStartBroker,
  // questOwningGuildFindBroker and recipesReadBroker directly below, never through their own setup
  // methods.
  instanceStartBrokerProxy();
  questOwningGuildFindBrokerProxy();
  recipesReadBrokerProxy();

  const instanceStartHandle = registerMock({ fn: instanceStartBroker });
  const owningGuildFindHandle = registerMock({ fn: questOwningGuildFindBroker });
  const recipesReadHandle = registerMock({ fn: recipesReadBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);
  recipesReadHandle.calledWith([]).resolves([]);

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

    stageRecipeListing: ({ entries }: { entries: readonly RecipeListingEntry[] }): void => {
      recipesReadHandle.calledWith([]).resolves(entries);
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
