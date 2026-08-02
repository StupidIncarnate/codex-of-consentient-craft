/**
 * PURPOSE: Quest lifecycle helpers for orchestration integration tests — creating a guild + quest
 * and seeding a quest directly to `in_progress` with an operations ledger + linked work items
 *
 * USAGE:
 * const quest = orchestrationQuestHarness();
 * const { guild, questId } = await quest.createGuildAndQuest({ testbed });
 * await quest.seedInProgressRelay({ questId, operations, workItems });
 */
import { randomUUID } from 'crypto';
import { existsSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { resolve as pathResolve, join as pathNodeJoin } from 'path';

import type {
  GuildId,
  QuestId,
  FilePath,
  FlowStub,
  OperationItemStub,
  QuestCommentStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import {
  GuildNameStub,
  GuildPathStub,
  fileContentsContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { GuildAddResponder } from '../../../src/responders/guild/add/guild-add-responder';
import { GuildRemoveResponder } from '../../../src/responders/guild/remove/guild-remove-responder';
import { QuestUserAddResponder } from '../../../src/responders/quest/user-add/quest-user-add-responder';
import { questFindQuestPathBroker } from '../../../src/brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../../src/brokers/quest/load/quest-load-broker';
import { questPersistBroker } from '../../../src/brokers/quest/persist/quest-persist-broker';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';

// The real fake-Claude-CLI binary lives in the web package's e2e harness (it records every
// invocation's argv to prove --resume/-p mechanics for Playwright specs). Referencing its
// on-disk path here — not importing any code from packages/web — lets an orchestrator-level
// integration test spawn the SAME controllable binary instead of risking a real `claude`
// process when CLAUDE_CLI_PATH is left unset. NOTE: this package's OWN
// `orchestration-environment.harness.ts` points `FAKE_CLAUDE_CLI` at
// `packages/testing/test/harnesses/claude-mock/bin/claude`, which does not exist on disk
// (`packages/testing/test/` is absent entirely) — that harness's `setup()` is currently
// broken for any caller that reaches a real spawn. This constant resolves the binary that
// actually exists.
const REAL_FAKE_CLAUDE_CLI_BIN = pathResolve(
  __dirname,
  '../../../../web/test/harnesses/claude-mock/bin/claude',
);

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

type OperationItem = ReturnType<typeof OperationItemStub>;
type WorkItem = ReturnType<typeof WorkItemStub>;
type Flow = ReturnType<typeof FlowStub>;
type QuestComment = ReturnType<typeof QuestCommentStub>;
type Quest = ReturnType<typeof QuestStub>;

export const orchestrationQuestHarness = (): {
  afterEach: () => Promise<void>;
  createGuildAndQuest: (params: {
    testbed: ReturnType<typeof installTestbedCreateBroker>;
    title?: string;
    userRequest?: string;
  }) => Promise<{
    guild: Awaited<ReturnType<typeof GuildAddResponder>>;
    questId: QuestId;
  }>;
  seedInProgressRelay: (params: {
    questId: QuestId;
    operations: readonly OperationItem[];
    workItems: readonly WorkItem[];
  }) => Promise<void>;
  // Overwrites flows/workItems/comments directly on disk, leaving every other field (status,
  // title, etc.) as QuestUserAddResponder set it. Bypasses QuestModifyResponder the same way
  // seedInProgressRelay does — the per-status input allowlist is covered by the broker/
  // responder unit tests, not by this fixture-building helper.
  seedFlowsAndComments: (params: {
    questId: QuestId;
    flows: readonly Flow[];
    workItems: readonly WorkItem[];
    comments: readonly QuestComment[];
  }) => Promise<void>;
  // Reads the quest back off real disk — for asserting what a prior seed or a real broker
  // call actually persisted.
  reload: (params: { questId: QuestId }) => Promise<Quest>;
  removeGuild: (params: { guildId: GuildId }) => Promise<void>;
  // Points CLAUDE_CLI_PATH at the real (working) fake-Claude-CLI binary and FAKE_CLAUDE_QUEUE_DIR
  // at a fresh, empty temp dir, so a caller that reaches a real spawn (chatSpawnBroker →
  // agentLaunchBroker → child-process-spawn-stream-json-adapter) exercises a genuine OS process
  // under full control instead of risking the bare `claude` command. Call `restore()` even when
  // the test never reaches a spawn.
  configureFakeClaudeCli: () => { claudeQueueDir: FilePath; restore: () => void };
  // Polls for the fake CLI's `invocations.jsonl` ledger (one JSON line per spawn, written BEFORE
  // any queued response is read, recording the real `--resume <sessionId>` and `-p <prompt>`
  // argv) under `claudeQueueDir`, scoped by the spawn's `cwd`. Returns the last recorded
  // invocation, or `null` if none appeared before `timeoutMs` — the honest way to prove a REAL
  // spawn either happened with the right argv, or never happened at all.
  waitForClaudeInvocation: (params: {
    claudeQueueDir: FilePath;
    cwd: string;
    timeoutMs: number;
  }) => Promise<unknown>;
} => {
  const createdGuildIds: GuildId[] = [];

  // Seeds a quest directly to `in_progress` with the supplied operations ledger + linked work
  // items by writing the quest JSON to disk. It bypasses QuestModifyResponder so the lifecycle
  // validators (per-status input allowlist, transition checks) are not exercised here — those are
  // covered by the broker/responder unit tests. This mirrors a quest whose Start Quest transition
  // already seeded the relay.
  const seedInProgressRelay = async ({
    questId,
    operations,
    workItems,
  }: {
    questId: QuestId;
    operations: readonly OperationItem[];
    workItems: readonly WorkItem[];
  }): Promise<void> => {
    const { questPath } = await questFindQuestPathBroker({ questId });
    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );
    const loadedQuest = await questLoadBroker({ questFilePath });

    const seededQuest = {
      ...loadedQuest,
      status: 'in_progress' as typeof loadedQuest.status,
      operations: [...operations],
      workItems: [...workItems],
      updatedAt: new Date().toISOString() as typeof loadedQuest.updatedAt,
    };

    const questJson = fileContentsContract.parse(
      JSON.stringify(seededQuest, null, JSON_INDENT_SPACES),
    );
    await questPersistBroker({ questFilePath, contents: questJson, questId });
  };

  const loadByQuestId = async (params: { questId: QuestId }): Promise<Quest> => {
    const { questId } = params;
    const { questPath } = await questFindQuestPathBroker({ questId });
    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );
    return questLoadBroker({ questFilePath });
  };

  const configureFakeClaudeCli = (): { claudeQueueDir: FilePath; restore: () => void } => {
    const claudeQueueDir = pathNodeJoin(tmpdir(), `claude-queue-${randomUUID()}`);
    const savedCliPath = process.env.CLAUDE_CLI_PATH;
    const savedQueueDir = process.env.FAKE_CLAUDE_QUEUE_DIR;

    process.env.CLAUDE_CLI_PATH = REAL_FAKE_CLAUDE_CLI_BIN;
    process.env.FAKE_CLAUDE_QUEUE_DIR = claudeQueueDir;

    return {
      claudeQueueDir: filePathContract.parse(claudeQueueDir),
      restore: (): void => {
        if (savedCliPath === undefined) {
          Reflect.deleteProperty(process.env, 'CLAUDE_CLI_PATH');
        } else {
          process.env.CLAUDE_CLI_PATH = savedCliPath;
        }
        if (savedQueueDir === undefined) {
          Reflect.deleteProperty(process.env, 'FAKE_CLAUDE_QUEUE_DIR');
        } else {
          process.env.FAKE_CLAUDE_QUEUE_DIR = savedQueueDir;
        }
        rmSync(claudeQueueDir, { recursive: true, force: true });
      },
    };
  };

  // The mock CLI scopes its invocation ledger under `__by_cwd__/<encoded spawn cwd>/` (see
  // packages/web/test/harnesses/claude-mock/bin/claude) so parallel specs never collide. Encoding
  // is replicated verbatim (`[^A-Za-z0-9._-]` -> `_`) rather than imported, since the mock is a
  // plain Node script outside any package's public API.
  const encodeCwdForFakeCli = (cwd: string) => cwd.replace(/[^A-Za-z0-9._-]/gu, '_');

  const readLastInvocation = (invocationsPath: string): unknown => {
    const lines = readFileSync(invocationsPath, 'utf-8').trim().split('\n');
    return JSON.parse(lines[lines.length - 1] ?? '{}') as unknown;
  };

  const pollForInvocation = async (params: {
    invocationsPath: string;
    deadline: number;
  }): Promise<unknown> => {
    const { invocationsPath, deadline } = params;
    if (existsSync(invocationsPath)) {
      return readLastInvocation(invocationsPath);
    }
    if (Date.now() >= deadline) {
      return null;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    return pollForInvocation({ invocationsPath, deadline });
  };

  const waitForClaudeInvocation = async ({
    claudeQueueDir,
    cwd,
    timeoutMs,
  }: {
    claudeQueueDir: FilePath;
    cwd: string;
    timeoutMs: number;
  }): Promise<unknown> => {
    const invocationsPath = pathNodeJoin(
      String(claudeQueueDir),
      '__by_cwd__',
      encodeCwdForFakeCli(cwd),
      'invocations.jsonl',
    );
    return pollForInvocation({ invocationsPath, deadline: Date.now() + timeoutMs });
  };

  return {
    afterEach: async (): Promise<void> => {
      const idsToRemove = [...createdGuildIds];
      createdGuildIds.length = 0;
      await Promise.all(
        idsToRemove.map(async (guildId) => {
          try {
            await GuildRemoveResponder({ guildId });
          } catch {
            // Guild config may be unavailable if the test environment was already cleaned up.
          }
        }),
      );
    },
    createGuildAndQuest: async ({
      testbed,
      title = 'Integration Test Quest',
      userRequest = 'An integration test quest',
    }: {
      testbed: ReturnType<typeof installTestbedCreateBroker>;
      title?: string;
      userRequest?: string;
    }) => {
      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Integ Test Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      createdGuildIds.push(guild.id);

      const addResult = await QuestUserAddResponder({
        title,
        userRequest,
        guildId: guild.id,
      });

      const questId = addResult.questId!;

      return { guild, questId };
    },
    seedInProgressRelay,
    seedFlowsAndComments: async ({
      questId,
      flows,
      workItems,
      comments,
    }: {
      questId: QuestId;
      flows: readonly Flow[];
      workItems: readonly WorkItem[];
      comments: readonly QuestComment[];
    }): Promise<void> => {
      const { questPath } = await questFindQuestPathBroker({ questId });
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
      );
      const loadedQuest = await questLoadBroker({ questFilePath });

      const seededQuest = {
        ...loadedQuest,
        flows: [...flows],
        workItems: [...workItems],
        comments: [...comments],
      };

      const questJson = fileContentsContract.parse(
        JSON.stringify(seededQuest, null, JSON_INDENT_SPACES),
      );
      await questPersistBroker({ questFilePath, contents: questJson, questId });
    },
    reload: loadByQuestId,
    configureFakeClaudeCli,
    waitForClaudeInvocation,
    removeGuild: async ({ guildId }: { guildId: GuildId }): Promise<void> => {
      await GuildRemoveResponder({ guildId });
    },
  };
};
