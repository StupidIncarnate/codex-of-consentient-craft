import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { wardExitCodeStatics } from '@dungeonmaster/shared/statics';

import { stepHandlerWardBroker } from './step-handler-ward-broker';
import { stepHandlerWardBrokerProxy } from './step-handler-ward-broker.proxy';

type ContentText = string;

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

describe('stepHandlerWardBroker', () => {
  describe('exit 0 with a run id', () => {
    it('VALID: {exit 0, run: <id>} => classifies done', async () => {
      const proxy = stepHandlerWardBrokerProxy();
      const runId = '1780108054226-a080';
      proxy.wardExits({
        questId: QUEST_ID,
        exitCode: wardExitCodeStatics.exitCodes.pass,
        runId,
        detailJson: '{"checks":[]}',
      });

      const result = await stepHandlerWardBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('done');
    });

    it('VALID: {exit 0, run: <id>} => resultRef points at the wardResults ref', async () => {
      const proxy = stepHandlerWardBrokerProxy();
      const runId = '1780108054226-a080';
      proxy.wardExits({
        questId: QUEST_ID,
        exitCode: wardExitCodeStatics.exitCodes.pass,
        runId,
        detailJson: '{"checks":[]}',
      });

      const result = await stepHandlerWardBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.resultRef).toBe('wardResults/f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0f0');
    });
  });

  describe('exit 0 with NO run id — the row that proves it is the run id, not the message', () => {
    it('EMPTY: {exit 0, no run: <id> line} => classifies empty, not done', async () => {
      const proxy = stepHandlerWardBrokerProxy();
      proxy.wardExitsWithoutRunId({
        questId: QUEST_ID,
        exitCode: wardExitCodeStatics.exitCodes.pass,
      });

      const result = await stepHandlerWardBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('empty');
    });
  });

  describe('exit 1', () => {
    it('VALID: {exit 1} => classifies unmet, never wall', async () => {
      const proxy = stepHandlerWardBrokerProxy();
      proxy.wardExitsWithoutRunId({
        questId: QUEST_ID,
        exitCode: wardExitCodeStatics.exitCodes.failing,
      });

      const result = await stepHandlerWardBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('unmet');
    });
  });

  describe('exit 2 — the crash OPEN, answered: crash classifies wall', () => {
    it('ERROR: {exit 2} => classifies wall', async () => {
      const proxy = stepHandlerWardBrokerProxy();
      proxy.wardExitsWithoutRunId({
        questId: QUEST_ID,
        exitCode: wardExitCodeStatics.exitCodes.crash,
      });

      const result = await stepHandlerWardBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('wall');
    });
  });

  describe('args pass through verbatim, with the subcommand prepended', () => {
    it('VALID: {args: [--committed, --uncommitted]} => spawns [run, --committed, --uncommitted]', async () => {
      const proxy = stepHandlerWardBrokerProxy();
      proxy.wardExitsWithoutRunId({
        questId: QUEST_ID,
        exitCode: wardExitCodeStatics.exitCodes.pass,
      });

      await stepHandlerWardBroker({
        args: ['--committed', '--uncommitted'],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(proxy.getSpawnedWardArgs()).toStrictEqual(['run', '--committed', '--uncommitted']);
    });

    it('VALID: {args: []} => spawns [run] — the full ward, not the branch gate', async () => {
      const proxy = stepHandlerWardBrokerProxy();
      proxy.wardExitsWithoutRunId({
        questId: QUEST_ID,
        exitCode: wardExitCodeStatics.exitCodes.pass,
      });

      await stepHandlerWardBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(proxy.getSpawnedWardArgs()).toStrictEqual(['run']);
    });
  });

  describe('a ward installed in the quest worktree', () => {
    it('VALID: {local ward in the worktree} => spawns node on its entry script with [run, ...args]', async () => {
      const proxy = stepHandlerWardBrokerProxy();
      proxy.wardInstalledLocally({
        questId: QUEST_ID,
        exitCode: wardExitCodeStatics.exitCodes.pass,
        manifestJson: JSON.stringify({
          name: '@dungeonmaster/ward',
          bin: { 'dungeonmaster-ward': './dist/bin/ward-entry.js' },
        }),
      });

      await stepHandlerWardBroker({
        args: ['--committed'],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(proxy.getSpawnedLocalWardArgs()).toStrictEqual([
        '/repo/worktrees/add-auth/node_modules/@dungeonmaster/ward/dist/bin/ward-entry.js',
        'run',
        '--committed',
      ]);
    });
  });

  describe('a missing worktree', () => {
    it('ERROR: {missing-worktree resolution} => throws — a wall at the handler boundary', async () => {
      const proxy = stepHandlerWardBrokerProxy();
      proxy.setupWorktreeMissing({
        questId: QUEST_ID,
        worktreePath: '/repo/worktrees/add-auth',
      });

      await expect(
        stepHandlerWardBroker({
          args: [],
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          onLine: () => undefined,
        }),
      ).rejects.toThrow(/worktree not found/u);
    });
  });

  describe('onLine streaming', () => {
    it('VALID: {ward output} => a line reaches the callback DURING the run', async () => {
      const proxy = stepHandlerWardBrokerProxy();
      proxy.wardExits({
        questId: QUEST_ID,
        exitCode: wardExitCodeStatics.exitCodes.pass,
        runId: '1780108054226-a080',
        detailJson: '{"checks":[]}',
      });
      const seenLines: ContentText[] = [];

      await stepHandlerWardBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: (line) => seenLines.push(line),
      });

      expect(seenLines).toStrictEqual(['run: 1780108054226-a080', 'lint: PASS']);
    });
  });
});
