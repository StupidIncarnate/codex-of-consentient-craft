import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  AddQuestInputStub,
  GuildNameStub,
  GuildPathStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestWorkItemIdStub,
  WardRunIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { QuestFlow } from './quest-flow';
import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQueueHarness } from '../../../test/harnesses/orchestration-queue/orchestration-queue.harness';
import { orchestrationQuestHarness } from '../../../test/harnesses/orchestration-quest/orchestration-quest.harness';

describe('QuestFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const queue = orchestrationQueueHarness();
  const questHelper = orchestrationQuestHarness();

  describe('delegation to responders', () => {
    it('VALID: {questId: nonexistent} => get delegates to QuestGetResponder and returns error', async () => {
      const result = await QuestFlow.get({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });
  });

  // The operations relay: an agent session ends with signal-back complete carrying an
  // operationStatus. The real handle-signal-back responder → operations-update broker → advance
  // broker chain applies the outcome to the ledger and creates the next work item, all against the
  // real filesystem. These drive QuestFlow end-to-end (not mocked) — the seam the broker unit tests
  // mock.
  describe('operations relay — advance on done', () => {
    it('VALID: {codeweaver signals complete/done} => operation completes, advance creates the flowrider work item, and get-next-step dispatches it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-relay-done' }),
      });
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000c1' });
      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f1' });
      const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: cwOpId,
            role: 'codeweaver',
            text: 'build core',
            status: 'in_progress',
            locked: false,
          }),
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'verify flows',
            status: 'pending',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: cwWorkItemId,
            role: 'codeweaver',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(cwOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      await QuestFlow.handleSignalBack({
        questId,
        workItemId: cwWorkItemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      const afterAdvance = await QuestGetResponder({ questId });
      const flowWorkItem = afterAdvance.quest!.workItems.find((wi) => wi.role === 'flowrider');
      const nextStep = await QuestFlow.getNextStep();

      testbed.cleanup();

      expect({
        questStatus: afterAdvance.quest!.status,
        operations: afterAdvance.quest!.operations.map((op) => ({ role: op.role, status: op.status })),
        cwWorkItemStatus: afterAdvance.quest!.workItems.find((wi) => wi.id === cwWorkItemId)?.status,
        flowWorkItemStatus: flowWorkItem?.status,
        flowWorkItemLink: flowWorkItem?.relatedDataItems,
      }).toStrictEqual({
        questStatus: 'in_progress',
        operations: [
          { role: 'codeweaver', status: 'complete' },
          { role: 'flowrider', status: 'in_progress' },
        ],
        cwWorkItemStatus: 'complete',
        flowWorkItemStatus: 'pending',
        flowWorkItemLink: [`operations/${String(flowOpId)}`],
      });

      expect(nextStep).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'flowrider',
            workItemId: flowWorkItem!.id,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "flowrider",\n  workItemId: "${String(flowWorkItem!.id)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(flowWorkItem!.id)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
          },
        ],
      });
    }, 30_000);
  });

  describe('operations relay — duplicate-on-partial', () => {
    it('VALID: {codeweaver signals complete/partial} => operation completes, a pt continuation is appended, and a fresh codeweaver work item runs it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-relay-partial' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000c2' });
      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f2' });
      const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: cwOpId,
            role: 'codeweaver',
            text: 'build core',
            status: 'in_progress',
            locked: false,
          }),
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'verify flows',
            status: 'pending',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: cwWorkItemId,
            role: 'codeweaver',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(cwOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      await QuestFlow.handleSignalBack({
        questId,
        workItemId: cwWorkItemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      const afterPartial = await QuestGetResponder({ questId });
      const ptOp = afterPartial.quest!.operations.find((op) => String(op.text).startsWith('pt 2:'));
      const freshWorkItem = afterPartial.quest!.workItems.find((wi) => wi.id !== cwWorkItemId);

      testbed.cleanup();

      expect({
        questStatus: afterPartial.quest!.status,
        operations: afterPartial.quest!.operations.map((op) => ({
          role: op.role,
          status: op.status,
          text: String(op.text),
        })),
        codeweaverWorkItemCount: afterPartial.quest!.workItems.filter(
          (wi) => wi.role === 'codeweaver',
        ).length,
        freshWorkItemStatus: freshWorkItem?.status,
        freshWorkItemLink: freshWorkItem?.relatedDataItems,
      }).toStrictEqual({
        questStatus: 'in_progress',
        operations: [
          { role: 'codeweaver', status: 'complete', text: 'build core' },
          { role: 'codeweaver', status: 'in_progress', text: 'pt 2: build core' },
          { role: 'flowrider', status: 'pending', text: 'verify flows' },
        ],
        codeweaverWorkItemCount: 2,
        freshWorkItemStatus: 'pending',
        freshWorkItemLink: [`operations/${String(ptOp!.id)}`],
      });
    }, 30_000);
  });

  describe('ward operation item — green advances the relay', () => {
    it('VALID: {ward exits 0} => ward operation item completes and advance dispatches the next verify role', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-ward-green' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const wardOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000a1' });
      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000a2' });
      const wardWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: wardOpId,
            role: 'ward',
            text: 'ward (changed)',
            status: 'in_progress',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'verify flows',
            status: 'pending',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: wardWorkItemId,
            role: 'ward',
            status: 'in_progress',
            spawnerType: 'command',
            wardMode: 'changed',
            relatedDataItems: [`operations/${String(wardOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      queue.enqueue({
        queueDir: env.wardQueueDir,
        response: {
          exitCode: 0,
          runId: WardRunIdStub({ value: `1739625600000-a1f${String(Date.now() % 100000)}` }),
          wardResultJson: { checks: [] },
        },
      });

      const wardRun = await QuestFlow.runWard({
        questId,
        workItemId: wardWorkItemId,
        mode: 'changed',
      });

      const afterWard = await QuestGetResponder({ questId });
      const flowWorkItem = afterWard.quest!.workItems.find((wi) => wi.role === 'flowrider');

      testbed.cleanup();

      expect({
        exitCode: wardRun.exitCode,
        questStatus: afterWard.quest!.status,
        operations: afterWard.quest!.operations.map((op) => ({ role: op.role, status: op.status })),
        wardWorkItemStatus: afterWard.quest!.workItems.find((wi) => wi.id === wardWorkItemId)
          ?.status,
        flowWorkItemStatus: flowWorkItem?.status,
        flowWorkItemLink: flowWorkItem?.relatedDataItems,
      }).toStrictEqual({
        exitCode: 0,
        questStatus: 'in_progress',
        operations: [
          { role: 'ward', status: 'complete' },
          { role: 'flowrider', status: 'in_progress' },
        ],
        wardWorkItemStatus: 'complete',
        flowWorkItemStatus: 'pending',
        flowWorkItemLink: [`operations/${String(flowOpId)}`],
      });
    }, 30_000);
  });

  describe('ward operation item — red inserts a spiritmender then a fresh ward', () => {
    it('VALID: {ward exits 1} => ward completes, a spiritmender + fresh ward are appended, and advance dispatches the spiritmender (never another ward)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-ward-red' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const wardOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000b1' });
      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000b2' });
      const wardWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: wardOpId,
            role: 'ward',
            text: 'ward (changed)',
            status: 'in_progress',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'verify flows',
            status: 'pending',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: wardWorkItemId,
            role: 'ward',
            status: 'in_progress',
            spawnerType: 'command',
            wardMode: 'changed',
            relatedDataItems: [`operations/${String(wardOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      queue.enqueue({
        queueDir: env.wardQueueDir,
        response: {
          exitCode: 1,
          runId: WardRunIdStub({ value: `1739625600000-b1f${String(Date.now() % 100000)}` }),
          wardResultJson: {
            checks: [
              {
                projectResults: [
                  {
                    errors: [
                      {
                        filePath: '/repo/src/brokers/auth/login/auth-login-broker.ts',
                        message: 'Property loginUser does not exist on type AuthService',
                        line: 42,
                        column: 7,
                        rule: 'no-undef-property',
                      },
                    ],
                    testFailures: [],
                  },
                ],
              },
            ],
          },
        },
      });

      const wardRun = await QuestFlow.runWard({
        questId,
        workItemId: wardWorkItemId,
        mode: 'changed',
      });

      const afterRed = await QuestGetResponder({ questId });
      const spiritOp = afterRed.quest!.operations.find((op) => op.role === 'spiritmender');
      const spiritWorkItem = afterRed.quest!.workItems.find((wi) => wi.role === 'spiritmender');

      testbed.cleanup();

      expect({
        exitCode: wardRun.exitCode,
        questStatus: afterRed.quest!.status,
        operations: afterRed.quest!.operations.map((op) => ({
          role: op.role,
          status: op.status,
        })),
        freshWardMode: afterRed
          .quest!.operations.filter((op) => op.role === 'ward')
          .find((op) => op.id !== wardOpId)?.wardMode,
        wardWorkItemStatus: afterRed.quest!.workItems.find((wi) => wi.id === wardWorkItemId)?.status,
        spiritWorkItemStatus: spiritWorkItem?.status,
        spiritWorkItemLink: spiritWorkItem?.relatedDataItems,
      }).toStrictEqual({
        exitCode: 1,
        questStatus: 'in_progress',
        operations: [
          { role: 'ward', status: 'complete' },
          { role: 'spiritmender', status: 'in_progress' },
          { role: 'ward', status: 'pending' },
          { role: 'flowrider', status: 'pending' },
        ],
        freshWardMode: 'changed',
        wardWorkItemStatus: 'failed',
        spiritWorkItemStatus: 'pending',
        spiritWorkItemLink: [`operations/${String(spiritOp!.id)}`],
      });
    }, 30_000);
  });

  // Flow: Auto-create guild on create-quest. Entry point mcp__dungeonmaster__create-quest,
  // surfaced in-process as QuestFlow.mcpCreate. These drive the WHOLE real seam end-to-end —
  // processCwdAdapter → cwdResolveBroker → guildListBroker → guildCoversRepoRootGuard →
  // guildAddBroker → questUserAddBroker against a real DUNGEONMASTER_HOME + real cwd. The
  // broker/responder/guard unit tests mock every one of those, so this is the only place the
  // glue between create-quest and the guild brokers is proven against the real filesystem.
  describe('auto-create guild on create-quest', () => {
    const { userRequest } = AddQuestInputStub();

    it('VALID: {no covering guild registered} => auto-creates a guild at the repo root, creates its quests dir, persists the quest, and returns { questId, guildSlug }', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-autocreate' }),
      });
      // tempDir doubles as DUNGEONMASTER_HOME AND the repo root the cwd resolves to:
      // the guild gets path === repo root === testbed dir.
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      envHarness.writeRepoRootMarker({ repoRoot });
      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const created = guildsAfter[0]!;
      const questsDirExists = envHarness.questsDirExists({
        tempDir: repoRoot,
        guildId: created.guildId,
      });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: created.guildId,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-guild-appended + check-new-guild-slug-returned: exactly one guild (the complete
      // array is [created]), anchored at the repo root, and the returned slug is its urlSlug.
      expect(guildsAfter).toStrictEqual([
        {
          name: created.name,
          path: created.path,
          guildId: created.guildId,
          urlSlug: created.urlSlug,
        },
      ]);
      expect(created.path).toBe(String(repoRoot));
      expect(result.guildSlug).toBe(created.urlSlug);
      // check-quests-dir-created + check-quest-persisted.
      expect(questsDirExists).toBe(true);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('VALID: {a guild already covers the repo root} => reuses it, appends no new guild, returns the existing guild slug', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-reuse' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      envHarness.writeRepoRootMarker({ repoRoot });

      // Pre-register a guild whose path equals the repo root.
      const existing = await GuildAddResponder({
        name: GuildNameStub({ value: 'Existing Covering Guild' }),
        path: repoRoot,
      });

      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: existing.id,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-no-duplicate-when-covered: the complete guilds array is still just the
      // pre-registered guild — no new entry was appended.
      expect(guildsAfter).toStrictEqual([
        {
          name: existing.name,
          path: existing.path,
          guildId: existing.id,
          urlSlug: existing.urlSlug,
        },
      ]);
      // check-existing-guild-slug-returned: the returned slug is the existing guild's urlSlug,
      // and the quest persisted under the EXISTING guild (reuse, not a fresh guild).
      expect(result.guildSlug).toBe(existing.urlSlug);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('VALID: {cwd is a subfolder of an already-registered guild} => reuses the ancestor guild (matches repo root, not the literal subfolder cwd)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-subfolder' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      // .dungeonmaster.json lives ONLY at the repo root, so cwdResolveBroker walking up from the
      // subfolder resolves to the repo root.
      envHarness.writeRepoRootMarker({ repoRoot });

      const ancestor = await GuildAddResponder({
        name: GuildNameStub({ value: 'Ancestor Guild' }),
        path: repoRoot,
      });

      // Create a nested subfolder under the repo root and run create-quest from there.
      const subfolder = GuildPathStub({ value: `${String(repoRoot)}/packages/some-pkg/src` });
      const cwd = envHarness.makeAndChdir({ dir: subfolder });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: ancestor.id,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // The ancestor guild covers the resolved repo root: the complete guilds array is just the
      // ancestor — no duplicate — and the slug + quest belong to it.
      expect(guildsAfter).toStrictEqual([
        {
          name: ancestor.name,
          path: ancestor.path,
          guildId: ancestor.id,
          urlSlug: ancestor.urlSlug,
        },
      ]);
      expect(result.guildSlug).toBe(ancestor.urlSlug);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('EDGE: {no .dungeonmaster.json anywhere up the tree AND no covering guild} => cwdResolveBroker rejects, broker falls back to literal cwd, auto-creates a guild there, and still returns { questId, guildSlug }', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-fallback' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      // setupHome writes config.json but NO .dungeonmaster.json — and /tmp has none up the tree,
      // so cwdResolveBroker walks to filesystem root and throws ProjectRootNotFoundError, exercising
      // the literal-cwd fallback against the real resolver (not a mocked rejection).
      envHarness.setupHome({ tempDir: repoRoot });
      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const created = guildsAfter[0]!;
      const questsDirExists = envHarness.questsDirExists({
        tempDir: repoRoot,
        guildId: created.guildId,
      });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: created.guildId,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-fallback-autocreate-at-cwd: exactly one guild (complete array is [created]) was
      // auto-created with path === literal cwd.
      expect(guildsAfter).toStrictEqual([
        {
          name: created.name,
          path: created.path,
          guildId: created.guildId,
          urlSlug: created.urlSlug,
        },
      ]);
      expect(created.path).toBe(String(repoRoot));
      expect(result.guildSlug).toBe(created.urlSlug);
      expect(questsDirExists).toBe(true);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);
  });
});
