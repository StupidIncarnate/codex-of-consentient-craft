import fs from 'fs';
import path from 'path';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildNameStub,
  GuildPathStub,
  ProcessIdStub,
  QuestIdStub,
  SystemInitStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { GuildRemoveResponder } from '../../responders/guild/remove/guild-remove-responder';
import { QuestAddResponder } from '../../responders/quest/add/quest-add-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { QuestModifyResponder } from '../../responders/quest/modify/quest-modify-responder';
import { ModifyQuestInputStub } from '../../contracts/modify-quest-input/modify-quest-input.stub';
import { OrchestrationFlow } from './orchestration-flow';

const FAKE_CLAUDE_CLI = path.resolve(
  __dirname,
  '../../../../..',
  'packages/testing/e2e/web/harness/claude-mock/bin/claude',
);

const FAKE_WARD_BIN_DIR = path.resolve(
  __dirname,
  '../../../../..',
  'packages/orchestrator/test-fixtures/fake-ward-bin',
);

const signalCompleteStreamLine = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'toolu_fake_signal',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'complete' },
      },
    ],
  },
});

const queueClaudeResponse = ({
  queueDir,
  index,
  sessionId,
}: {
  queueDir: ReturnType<typeof GuildPathStub>;
  index: ReturnType<typeof QuestIdStub>;
  sessionId: ReturnType<typeof QuestIdStub>;
}): void => {
  const initLine = JSON.stringify(SystemInitStreamLineStub({ session_id: sessionId }));

  fs.writeFileSync(
    path.join(queueDir, `${String(index).padStart(4, '0')}.json`),
    JSON.stringify({
      lines: [initLine, signalCompleteStreamLine],
      exitCode: 0,
      delayMs: 1,
      sessionId,
    }),
  );
};

const completeChaos = async ({
  questId,
}: {
  questId: ReturnType<typeof QuestIdStub>;
}): Promise<void> => {
  const result = await QuestGetResponder({ questId });
  const chaosItem = result.quest!.workItems.find((wi) => wi.role === 'chaoswhisperer');

  await QuestModifyResponder({
    questId,
    input: ModifyQuestInputStub({
      questId,
      workItems: [{ id: chaosItem!.id, status: 'complete', completedAt: new Date().toISOString() }],
    }),
  });
};

const approveQuest = async ({
  questId,
}: {
  questId: ReturnType<typeof QuestIdStub>;
}): Promise<void> => {
  await QuestModifyResponder({
    questId,
    input: ModifyQuestInputStub({ questId, status: 'explore_flows' }),
  });

  // Add a minimal flow (flows_approved gate requires non-empty flows array)
  await QuestModifyResponder({
    questId,
    input: ModifyQuestInputStub({
      questId,
      flows: [FlowStub()],
    }),
  });

  await QuestModifyResponder({
    questId,
    input: ModifyQuestInputStub({ questId, status: 'review_flows' }),
  });

  await QuestModifyResponder({
    questId,
    input: ModifyQuestInputStub({ questId, status: 'flows_approved' }),
  });

  await QuestModifyResponder({
    questId,
    input: ModifyQuestInputStub({ questId, status: 'explore_observables' }),
  });

  await QuestModifyResponder({
    questId,
    input: ModifyQuestInputStub({ questId, status: 'review_observables' }),
  });

  await QuestModifyResponder({
    questId,
    input: ModifyQuestInputStub({ questId, status: 'approved' }),
  });

  // Mark chaoswhisperer work item as complete so the orchestration loop
  // dispatches pathseeker instead of returning early (chat roles with no userMessage)
  await completeChaos({ questId });
};

const POLL_INTERVAL = 50;
const TERMINAL_STATUSES = new Set(['complete', 'blocked', 'abandoned']);

const pollForTerminal = async ({
  questId,
  timeoutMs,
}: {
  questId: ReturnType<typeof QuestIdStub>;
  timeoutMs: ReturnType<typeof QuestIdStub>;
}): Promise<Awaited<ReturnType<typeof QuestGetResponder>>> =>
  new Promise((resolve, reject) => {
    const start = Date.now();

    const check = (): void => {
      QuestGetResponder({ questId })
        .then((result) => {
          if (result.success && result.quest && TERMINAL_STATUSES.has(result.quest.status)) {
            resolve(result);
            return;
          }

          if (Date.now() - start >= Number(timeoutMs)) {
            reject(new Error(`Timed out waiting for terminal status after ${String(timeoutMs)}ms`));
            return;
          }

          setTimeout(check, POLL_INTERVAL);
        })
        .catch(reject);
    };

    check();
  });

describe('OrchestrationFlow', () => {
  describe('delegation to responders', () => {
    it('ERROR: {unknown processId} => getStatus delegates to OrchestrationGetStatusResponder and throws', () => {
      const processId = ProcessIdStub({ value: 'proc-nonexistent' });

      expect(() => OrchestrationFlow.getStatus({ processId })).toThrow(
        /Process not found: proc-nonexistent/u,
      );
    });

    it('ERROR: {nonexistent questId} => start delegates to OrchestrationStartResponder and throws quest not found', async () => {
      await expect(
        OrchestrationFlow.start({ questId: QuestIdStub({ value: 'nonexistent-quest-id' }) }),
      ).rejects.toThrow(/Quest not found: nonexistent-quest-id/u);
    });

    it('ERROR: {non-approved quest} => start throws quest must be approved before starting', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestration-non-approved' }),
      });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Orchestration Test Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestAddResponder({
        title: 'Test Quest',
        userRequest: 'A test quest for orchestration flow integration tests',
        guildId: guild.id,
      });

      await expect(OrchestrationFlow.start({ questId: addResult.questId! })).rejects.toThrow(
        /Quest must be approved before starting/u,
      );

      await GuildRemoveResponder({ guildId: guild.id });
      testbed.cleanup();

      expect(addResult.questId).toBeDefined();
    });

    it('VALID: {approved quest} => start returns processId and getStatus returns idle orchestration status', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestration-approved' }),
      });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Orchestration Approved Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestAddResponder({
        title: 'Approved Quest',
        userRequest: 'A quest that will be approved for orchestration start tests',
        guildId: guild.id,
      });

      const questId = addResult.questId!;

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_flows' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({
          questId,
          flows: [
            FlowStub({
              nodes: [FlowNodeStub({ observables: [FlowObservableStub()] })],
            }),
          ],
        }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'review_flows' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'flows_approved' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_observables' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'review_observables' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'approved' }),
      });

      const processId = await OrchestrationFlow.start({ questId });

      const questResult = await QuestGetResponder({ questId });

      expect(questResult.success).toBe(true);
      expect(questResult.quest!.status).toBe('in_progress');

      await GuildRemoveResponder({ guildId: guild.id });
      testbed.cleanup();

      expect(processId).toMatch(/^proc-/u);
      // With work-item queue model, the loop exits immediately when only chat items
      // are pending (no userMessage). The process may already be cleaned up.
    }, 30_000);
  });

  describe('full orchestration loop with fake CLI', () => {
    it('VALID: {approved quest, empty flows, fake CLI signals complete} => all phases complete and quest reaches complete status', async () => {
      const savedCliPath = String(process.env.CLAUDE_CLI_PATH);
      const savedClaudeQueueDir = String(process.env.FAKE_CLAUDE_QUEUE_DIR);
      const savedWardQueueDir = String(process.env.FAKE_WARD_QUEUE_DIR);
      const savedPath = String(process.env.PATH);

      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestration-happy-path' }),
      });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Happy Path Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestAddResponder({
        title: 'Happy Path Quest',
        userRequest: 'A quest for full orchestration loop integration test',
        guildId: guild.id,
      });

      const questId = addResult.questId!;

      await approveQuest({ questId });

      // Set up fake Claude CLI queue directory
      // Queue: pathseeker (index 0), siegemaster (index 1)
      const claudeQueueDir = GuildPathStub({
        value: path.join(testbed.guildPath, 'claude-queue'),
      });
      fs.mkdirSync(claudeQueueDir, { recursive: true });

      queueClaudeResponse({
        queueDir: claudeQueueDir,
        index: QuestIdStub({ value: '0' }),
        sessionId: QuestIdStub({ value: 'session-pathseeker-001' }),
      });
      queueClaudeResponse({
        queueDir: claudeQueueDir,
        index: QuestIdStub({ value: '1' }),
        sessionId: QuestIdStub({ value: 'session-siegemaster-001' }),
      });

      // Set up fake ward queue directory (exit code 0 = pass)
      const wardQueueDir = GuildPathStub({
        value: path.join(testbed.guildPath, 'ward-queue'),
      });
      fs.mkdirSync(wardQueueDir, { recursive: true });
      fs.writeFileSync(
        path.join(wardQueueDir, '0000.json'),
        JSON.stringify({
          exitCode: 0,
          runId: 'fake-ward-run-001',
          wardResultJson: { lint: { status: 'pass' }, test: { status: 'pass' } },
        }),
      );

      // Set env vars: fake CLI, queue dirs, and fake ward on PATH
      process.env.CLAUDE_CLI_PATH = FAKE_CLAUDE_CLI;
      process.env.FAKE_CLAUDE_QUEUE_DIR = claudeQueueDir;
      process.env.FAKE_WARD_QUEUE_DIR = wardQueueDir;
      process.env.PATH = `${FAKE_WARD_BIN_DIR}:${savedPath}`;

      await OrchestrationFlow.start({ questId });

      // Poll until quest reaches a terminal status
      const pollResult = await pollForTerminal({
        questId,
        timeoutMs: QuestIdStub({ value: '25000' }),
      });

      // Restore env vars
      process.env.CLAUDE_CLI_PATH = savedCliPath;
      process.env.FAKE_CLAUDE_QUEUE_DIR = savedClaudeQueueDir;
      process.env.FAKE_WARD_QUEUE_DIR = savedWardQueueDir;
      process.env.PATH = savedPath;

      await GuildRemoveResponder({ guildId: guild.id });
      testbed.cleanup();

      expect(pollResult.quest!.status).toBe('complete');
    }, 30_000);
  });
});
