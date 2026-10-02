/**
 * PURPOSE: Test proxy for SiegelenseStartResponder — mocks `instanceStartBroker`,
 * `questOwningGuildFindBroker`, `recipesReadBroker` and `servedBuildStaleReadBroker` directly rather than composing their own
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

import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { Quest, Guild } from '@dungeonmaster/shared/contracts';

import { instanceStartBroker } from '../../../brokers/instance/start/instance-start-broker';
import { instanceStartBrokerProxy } from '../../../brokers/instance/start/instance-start-broker.proxy';
import { questOwningGuildFindBroker } from '../../../brokers/quest/owning-guild-find/quest-owning-guild-find-broker';
import { questOwningGuildFindBrokerProxy } from '../../../brokers/quest/owning-guild-find/quest-owning-guild-find-broker.proxy';
import { recipesReadBroker } from '../../../brokers/recipes/read/recipes-read-broker';
import { recipesReadBrokerProxy } from '../../../brokers/recipes/read/recipes-read-broker.proxy';
import { servedBuildStaleReadBroker } from '../../../brokers/served-build/stale-read/served-build-stale-read-broker';
import { servedBuildStaleReadBrokerProxy } from '../../../brokers/served-build/stale-read/served-build-stale-read-broker.proxy';
import type { InstanceManifestStub } from '../../../contracts/instance-manifest/instance-manifest.stub';
import type { RecipeListingEntryStub } from '../../../contracts/recipe-listing-entry/recipe-listing-entry.stub';

// The directory the responder reads as where it runs; the repo root it hands down is this same path.
const CWD_VALUE = '/default/cwd';

type InstanceManifest = ReturnType<typeof InstanceManifestStub>;
type SpecName = string;
type RecipeListingEntry = ReturnType<typeof RecipeListingEntryStub>;

export const SiegelenseStartResponderProxy = (): {
  stageManifest: (params: { manifest: InstanceManifest }) => void;
  stageError: (params: { error: Error; specName: SpecName }) => void;
  stageQuestResolvesToGuild: (params: { questId: Quest['id']; guildId: Guild['id'] }) => void;
  stageQuestUnresolvable: (params: { questId: Quest['id']; error: Error }) => void;
  stageRecipeListing: (params: { entries: readonly RecipeListingEntry[] }) => void;
  stageStaleWarning: (params: { specName: SpecName; warning: string }) => void;
  stageStaleCheckError: (params: { specName: SpecName; error: Error }) => void;
  getStdoutWrites: () => unknown[];
  getStderrWrites: () => unknown[];
  getStartCallsMatching: (params: {
    specName: SpecName;
    questId: Quest['id'] | null;
    guildId: Guild['id'] | null;
    seed: string | null;
  }) => unknown[][];
  getOwningGuildFindCallsMatching: (params: { questId: Quest['id'] }) => unknown[][];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages instanceStartBroker,
  // questOwningGuildFindBroker and recipesReadBroker directly below, never through their own setup
  // methods.
  instanceStartBrokerProxy();
  questOwningGuildFindBrokerProxy();
  recipesReadBrokerProxy();
  servedBuildStaleReadBrokerProxy();

  const cwdStagingProxy = cwdProxy();
  cwdStagingProxy.setupCwd({ value: CWD_VALUE });
  const resolveProxy = cwdResolveBrokerProxy();
  resolveProxy.setupRepoRootFoundAtStart({ startPath: CWD_VALUE });

  const instanceStartHandle = registerMock({ fn: instanceStartBroker });
  const owningGuildFindHandle = registerMock({ fn: questOwningGuildFindBroker });
  const recipesReadHandle = registerMock({ fn: recipesReadBroker });
  const staleReadHandle = registerMock({ fn: servedBuildStaleReadBroker });
  // Keyed by spec name because `servedBuildStaleReadBroker` takes one. Every spec a scenario boots
  // defaults to '' — a current build — so a scenario that never stages a warning boots with nothing
  // on stderr.
  const staleBySpec = new Map<SpecName, Error | string>();
  const stageStale = ({
    specName,
    outcome,
  }: {
    specName: SpecName;
    outcome: Error | string;
  }): void => {
    staleBySpec.set(specName, outcome);
    if (typeof outcome === 'string') {
      staleReadHandle.calledWith([{ specName, repoRoot: CWD_VALUE }]).resolves(outcome);
      return;
    }
    staleReadHandle.calledWith([{ specName, repoRoot: CWD_VALUE }]).rejects(outcome);
  };
  const stageStaleDefault = ({ specName }: { specName: SpecName }): void => {
    stageStale({ specName, outcome: staleBySpec.get(specName) ?? '' });
  };
  const stderrRecorder = stderrProxy();
  const stdoutRecorder = stdoutProxy();
  recipesReadHandle.calledWith([{ repoRoot: CWD_VALUE }]).resolves([]);

  return {
    stageManifest: ({ manifest }: { manifest: InstanceManifest }): void => {
      stageStaleDefault({ specName: manifest.specName });
      instanceStartHandle.calledWith([{ specName: manifest.specName }]).resolves(manifest);
    },

    stageError: ({ error, specName }: { error: Error; specName: SpecName }): void => {
      stageStaleDefault({ specName });
      instanceStartHandle.calledWith([{ specName, repoRoot: CWD_VALUE }]).rejects(error);
    },

    stageQuestResolvesToGuild: ({
      questId,
      guildId,
    }: {
      questId: Quest['id'];
      guildId: Guild['id'];
    }): void => {
      owningGuildFindHandle.calledWith([{ questId }]).resolves(guildId);
    },

    stageQuestUnresolvable: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      owningGuildFindHandle.calledWith([{ questId }]).rejects(error);
    },

    stageRecipeListing: ({ entries }: { entries: readonly RecipeListingEntry[] }): void => {
      recipesReadHandle.calledWith([{ repoRoot: CWD_VALUE }]).resolves(entries);
    },

    stageStaleWarning: ({ specName, warning }: { specName: SpecName; warning: string }): void => {
      stageStale({ specName, outcome: warning });
    },

    stageStaleCheckError: ({ specName, error }: { specName: SpecName; error: Error }): void => {
      stageStale({ specName, outcome: error });
    },

    getStdoutWrites: (): unknown[] => [...stdoutRecorder.getWrites()],

    getStderrWrites: (): unknown[] => [...stderrRecorder.getWrites()],

    getStartCallsMatching: ({
      specName,
      questId,
      guildId,
      seed,
    }: {
      specName: SpecName;
      questId: Quest['id'] | null;
      guildId: Guild['id'] | null;
      seed: string | null;
    }): unknown[][] => instanceStartHandle.callsMatching([{ specName, questId, guildId, seed }]),

    getOwningGuildFindCallsMatching: ({ questId }: { questId: Quest['id'] }): unknown[][] =>
      owningGuildFindHandle.callsMatching([{ questId }]),
  };
};
