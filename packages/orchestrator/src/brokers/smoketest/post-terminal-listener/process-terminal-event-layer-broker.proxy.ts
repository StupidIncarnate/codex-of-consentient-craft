/**
 * PURPOSE: Proxy for processTerminalEventLayerBroker — two roles:
 *   1) Sibling tests of createTerminalHandlerLayerBroker stub this broker via setupSucceeds
 *      so the dispatched fire-and-forget call can be asserted without driving the file system.
 *   2) The broker's own test composes child proxies for end-to-end assertion (no module mock).
 *
 * USAGE (sibling test):
 * const proxy = processTerminalEventLayerBrokerProxy();
 * proxy.setupSucceeds();
 *
 * WHY registerModuleMock: createTerminalHandlerLayerBroker imports processTerminalEventLayerBroker
 * directly. Stack-based registerMock dispatch can match the handler's call site, but module-level
 * mocking is cleaner and matches questPauseBroker's pattern.
 */

import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { AbsoluteFilePath, FilePath, QuestId } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';
import type { MockHandle, RecordedCalls } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

import { processTerminalEventLayerBroker } from './process-terminal-event-layer-broker';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';
import { questPersistBrokerProxy } from '../../quest/persist/quest-persist-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../../quest/with-modify-lock/quest-with-modify-lock-broker.proxy';
import { smoketestAssertFinalStateBrokerProxy } from '../assert-final-state/smoketest-assert-final-state-broker.proxy';
import { smoketestRunTeardownChecksBrokerProxy } from '../run-teardown-checks/smoketest-run-teardown-checks-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

registerModuleMock({ module: './process-terminal-event-layer-broker' });

export const processTerminalEventLayerBrokerProxy = (): {
  reset: () => void;
  setupSucceeds: () => void;
  setupRejects: (params: { error: Error }) => void;
  setupPassthrough: () => void;
  setupQuestDeleted: (params: { homeDir: string; homePath: FilePath; guildsDir: FilePath }) => void;
  setupQuestFound: (params: {
    questId: QuestId;
    questPath: AbsoluteFilePath;
    quest: Quest;
  }) => void;
  getQuestFileJoinArgs: (params: { questPath: AbsoluteFilePath }) => readonly unknown[] | undefined;
  getCallArgs: () => RecordedCalls;
} => {
  const joinHandle: MockHandle = registerMock({ fn: join });
  const findProxy = questFindQuestPathBrokerProxy();
  const loadProxy = questLoadBrokerProxy();
  questPersistBrokerProxy();
  questWithModifyLockBrokerProxy();
  smoketestAssertFinalStateBrokerProxy();
  smoketestRunTeardownChecksBrokerProxy();

  const mocked = registerMock({ fn: processTerminalEventLayerBroker });

  return {
    reset: (): void => {
      // Child proxies self-reset via jest.clearAllMocks between tests.
    },
    // processTerminalEventLayerBroker takes one call-specific { questId, entry, scenarioMeta,
    // unregisterListener } argument that the caller (createTerminalHandlerLayerBroker's
    // dispatched handler) only builds AFTER this setup runs, and every test drives exactly one
    // dispatch — there is no real value available here to key on.
    setupSucceeds: (): void => {
      mocked.onceFor([]).resolves({ success: true });
    },
    setupRejects: ({ error }: { error: Error }): void => {
      mocked.onceFor([]).rejects(error);
    },
    setupPassthrough: (): void => {
      const realMod = requireActual<{
        processTerminalEventLayerBroker: typeof processTerminalEventLayerBroker;
      }>({
        module: './process-terminal-event-layer-broker',
      });
      mocked.calledWith([]).implement(realMod.processTerminalEventLayerBroker);
    },
    setupQuestDeleted: ({
      homeDir,
      homePath,
      guildsDir,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
    }): void => {
      // Simulates the "quest was deleted between the outbox event firing and this handler
      // running" case — `questFindQuestPathBroker` throws "not found in any guild" when no
      // guild dirs exist on disk.
      findProxy.setupNoGuilds({ homeDir, homePath, guildsDir });
    },
    // Resolves questId -> questPath through the real questFindQuestPathBroker chain
    // (questFindQuestPathBrokerProxy.setupQuestPath), which already stages the very same
    // join(questPath, quest.json) tuple for its own probe check — one home, read back below by
    // this proxy's own joinHandle since both calls share the identical mocked `join`.
    setupQuestFound: ({
      questId,
      questPath,
      quest,
    }: {
      questId: QuestId;
      questPath: AbsoluteFilePath;
      quest: Quest;
    }): void => {
      findProxy.setupQuestPath({ questId, guildId: GuildIdStub(), questPath });
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
    },
    getQuestFileJoinArgs: ({
      questPath,
    }: {
      questPath: AbsoluteFilePath;
    }): readonly unknown[] | undefined => joinHandle.callsMatching([questPath]).at(-1),
    getCallArgs: (): RecordedCalls => mocked.callsMatching([]),
  };
};
