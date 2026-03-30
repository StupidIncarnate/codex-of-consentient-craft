import {
  QuestIdStub,
  QuestStub,
  WorkItemStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { OrchestrationPauseResponderProxy } from './orchestration-pause-responder.proxy';

describe('OrchestrationPauseResponder', () => {
  describe('successful pause', () => {
    it('VALID: {quest in_progress with no running items} => returns paused true and sets status to paused', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ paused: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('paused');
    });

    it('VALID: {quest with in_progress work items} => resets work items to pending', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const wiId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const workItem = WorkItemStub({
        id: wiId,
        role: 'codeweaver',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [workItem] });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getLastPersistedQuest();
      const resetItem = persisted.workItems.find((wi) => wi.id === wiId);

      expect(resetItem?.status).toBe('pending');
    });

    it('VALID: {quest with running process} => kills process before pausing', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const kill = jest.fn();
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupWithRunningProcess({ quest, kill });

      await proxy.callResponder({ questId });

      expect(kill).toHaveBeenCalledTimes(1);
    });
  });

  describe('work item state preservation on pause', () => {
    it('VALID: {single codeweaver in_progress} => resets to pending, quest paused', async () => {
      const questId = QuestIdStub({ value: 'pause-single-cw' });
      const cw1Id = QuestWorkItemIdStub({ value: 'a1000000-0000-0000-0000-000000000001' });
      const cw1 = WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'in_progress' });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [cw1] });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const { status, workItems } = proxy.getLastPersistedQuest();

      expect(status).toBe('paused');
      expect(workItems).toStrictEqual([
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending' }),
      ]);
    });

    it('VALID: {single ward (spawnerType command) in_progress} => resets to pending, quest paused', async () => {
      const questId = QuestIdStub({ value: 'pause-single-ward' });
      const w1Id = QuestWorkItemIdStub({ value: 'a2000000-0000-0000-0000-000000000001' });
      const w1 = WorkItemStub({
        id: w1Id,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [w1] });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const { status, workItems } = proxy.getLastPersistedQuest();

      expect(status).toBe('paused');
      expect(workItems).toStrictEqual([
        WorkItemStub({ id: w1Id, role: 'ward', status: 'pending', spawnerType: 'command' }),
      ]);
    });

    it('VALID: {3 concurrent codeweavers all in_progress} => all reset to pending', async () => {
      const questId = QuestIdStub({ value: 'pause-3-cw' });
      const cw1Id = QuestWorkItemIdStub({ value: 'a3000000-0000-0000-0000-000000000001' });
      const cw2Id = QuestWorkItemIdStub({ value: 'a3000000-0000-0000-0000-000000000002' });
      const cw3Id = QuestWorkItemIdStub({ value: 'a3000000-0000-0000-0000-000000000003' });
      const cw1 = WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'in_progress' });
      const cw2 = WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'in_progress' });
      const cw3 = WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'in_progress' });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [cw1, cw2, cw3] });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const { status, workItems } = proxy.getLastPersistedQuest();

      expect(status).toBe('paused');
      expect(workItems).toStrictEqual([
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'pending' }),
      ]);
    });

    it('VALID: {3 concurrent lawbringers all in_progress} => all reset to pending', async () => {
      const questId = QuestIdStub({ value: 'pause-3-lb' });
      const lb1Id = QuestWorkItemIdStub({ value: 'a4000000-0000-0000-0000-000000000001' });
      const lb2Id = QuestWorkItemIdStub({ value: 'a4000000-0000-0000-0000-000000000002' });
      const lb3Id = QuestWorkItemIdStub({ value: 'a4000000-0000-0000-0000-000000000003' });
      const lb1 = WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'in_progress' });
      const lb2 = WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'in_progress' });
      const lb3 = WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'in_progress' });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [lb1, lb2, lb3] });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const { status, workItems } = proxy.getLastPersistedQuest();

      expect(status).toBe('paused');
      expect(workItems).toStrictEqual([
        WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending' }),
        WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'pending' }),
        WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'pending' }),
      ]);
    });

    it('VALID: {mixed concurrent roles: 2 codeweavers + 1 lawbringer all in_progress} => all reset to pending', async () => {
      const questId = QuestIdStub({ value: 'pause-mixed-concurrent' });
      const cw1Id = QuestWorkItemIdStub({ value: 'a5000000-0000-0000-0000-000000000001' });
      const cw2Id = QuestWorkItemIdStub({ value: 'a5000000-0000-0000-0000-000000000002' });
      const lb1Id = QuestWorkItemIdStub({ value: 'a5000000-0000-0000-0000-000000000003' });
      const cw1 = WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'in_progress' });
      const cw2 = WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'in_progress' });
      const lb1 = WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'in_progress' });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [cw1, cw2, lb1] });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const { status, workItems } = proxy.getLastPersistedQuest();

      expect(status).toBe('paused');
      expect(workItems).toStrictEqual([
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending' }),
      ]);
    });

    it('VALID: {in_progress item with completed dependency} => completed item untouched, in_progress reset', async () => {
      const questId = QuestIdStub({ value: 'pause-dep-chain' });
      const ps1Id = QuestWorkItemIdStub({ value: 'a6000000-0000-0000-0000-000000000001' });
      const cw1Id = QuestWorkItemIdStub({ value: 'a6000000-0000-0000-0000-000000000002' });
      const ps1 = WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' });
      const cw1 = WorkItemStub({
        id: cw1Id,
        role: 'codeweaver',
        status: 'in_progress',
        dependsOn: [ps1Id],
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [ps1, cw1] });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const { status, workItems } = proxy.getLastPersistedQuest();

      expect(status).toBe('paused');
      expect(workItems).toStrictEqual([
        WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' }),
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending', dependsOn: [ps1Id] }),
      ]);
    });

    it('VALID: {full dependency chain: complete -> in_progress -> pending} => only in_progress items reset', async () => {
      const questId = QuestIdStub({ value: 'pause-full-chain' });
      const ps1Id = QuestWorkItemIdStub({ value: 'a7000000-0000-0000-0000-000000000001' });
      const w1Id = QuestWorkItemIdStub({ value: 'a7000000-0000-0000-0000-000000000002' });
      const cw1Id = QuestWorkItemIdStub({ value: 'a7000000-0000-0000-0000-000000000003' });
      const cw2Id = QuestWorkItemIdStub({ value: 'a7000000-0000-0000-0000-000000000004' });
      const lb1Id = QuestWorkItemIdStub({ value: 'a7000000-0000-0000-0000-000000000005' });
      const ps1 = WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' });
      const w1 = WorkItemStub({
        id: w1Id,
        role: 'ward',
        status: 'complete',
        spawnerType: 'command',
        dependsOn: [ps1Id],
      });
      const cw1 = WorkItemStub({
        id: cw1Id,
        role: 'codeweaver',
        status: 'in_progress',
        dependsOn: [w1Id],
      });
      const cw2 = WorkItemStub({
        id: cw2Id,
        role: 'codeweaver',
        status: 'in_progress',
        dependsOn: [w1Id],
      });
      const lb1 = WorkItemStub({
        id: lb1Id,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [cw1Id, cw2Id],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [ps1, w1, cw1, cw2, lb1],
      });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const { status, workItems } = proxy.getLastPersistedQuest();

      expect(status).toBe('paused');
      expect(workItems).toStrictEqual([
        WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' }),
        WorkItemStub({
          id: w1Id,
          role: 'ward',
          status: 'complete',
          spawnerType: 'command',
          dependsOn: [ps1Id],
        }),
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending', dependsOn: [w1Id] }),
        WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending', dependsOn: [w1Id] }),
        WorkItemStub({
          id: lb1Id,
          role: 'lawbringer',
          status: 'pending',
          dependsOn: [cw1Id, cw2Id],
        }),
      ]);
    });

    it('VALID: {failed codeweaver + in_progress spiritmender} => failed untouched, spiritmender reset', async () => {
      const questId = QuestIdStub({ value: 'pause-failed-items' });
      const ps1Id = QuestWorkItemIdStub({ value: 'a8000000-0000-0000-0000-000000000001' });
      const cw1Id = QuestWorkItemIdStub({ value: 'a8000000-0000-0000-0000-000000000002' });
      const sp1Id = QuestWorkItemIdStub({ value: 'a8000000-0000-0000-0000-000000000003' });
      const ps1 = WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' });
      const cw1 = WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed' });
      const sp1 = WorkItemStub({ id: sp1Id, role: 'spiritmender', status: 'in_progress' });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [ps1, cw1, sp1] });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const { status, workItems } = proxy.getLastPersistedQuest();

      expect(status).toBe('paused');
      expect(workItems).toStrictEqual([
        WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' }),
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed' }),
        WorkItemStub({ id: sp1Id, role: 'spiritmender', status: 'pending' }),
      ]);
    });

    it('VALID: {skipped codeweaver + in_progress codeweaver} => skipped untouched, in_progress reset', async () => {
      const questId = QuestIdStub({ value: 'pause-skipped-items' });
      const ps1Id = QuestWorkItemIdStub({ value: 'a9000000-0000-0000-0000-000000000001' });
      const cw1Id = QuestWorkItemIdStub({ value: 'a9000000-0000-0000-0000-000000000002' });
      const cw2Id = QuestWorkItemIdStub({ value: 'a9000000-0000-0000-0000-000000000003' });
      const ps1 = WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' });
      const cw1 = WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'skipped' });
      const cw2 = WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'in_progress' });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [ps1, cw1, cw2] });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const { status, workItems } = proxy.getLastPersistedQuest();

      expect(status).toBe('paused');
      expect(workItems).toStrictEqual([
        WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' }),
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'skipped' }),
        WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending' }),
      ]);
    });

    it('VALID: {comprehensive mixed scenario with every status type} => only in_progress items reset', async () => {
      const questId = QuestIdStub({ value: 'pause-comprehensive' });
      const ps1Id = QuestWorkItemIdStub({ value: 'aa000000-0000-0000-0000-000000000001' });
      const cw1Id = QuestWorkItemIdStub({ value: 'aa000000-0000-0000-0000-000000000002' });
      const cw2Id = QuestWorkItemIdStub({ value: 'aa000000-0000-0000-0000-000000000003' });
      const lb1Id = QuestWorkItemIdStub({ value: 'aa000000-0000-0000-0000-000000000004' });
      const w1Id = QuestWorkItemIdStub({ value: 'aa000000-0000-0000-0000-000000000005' });
      const sm1Id = QuestWorkItemIdStub({ value: 'aa000000-0000-0000-0000-000000000006' });
      const sp1Id = QuestWorkItemIdStub({ value: 'aa000000-0000-0000-0000-000000000007' });
      const ps1 = WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' });
      const cw1 = WorkItemStub({
        id: cw1Id,
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [ps1Id],
      });
      const cw2 = WorkItemStub({
        id: cw2Id,
        role: 'codeweaver',
        status: 'in_progress',
        dependsOn: [ps1Id],
      });
      const lb1 = WorkItemStub({
        id: lb1Id,
        role: 'lawbringer',
        status: 'in_progress',
        dependsOn: [cw1Id],
      });
      const w1 = WorkItemStub({
        id: w1Id,
        role: 'ward',
        status: 'complete',
        spawnerType: 'command',
        dependsOn: [cw1Id],
      });
      const sm1 = WorkItemStub({
        id: sm1Id,
        role: 'siegemaster',
        status: 'pending',
        dependsOn: [w1Id],
      });
      const sp1 = WorkItemStub({ id: sp1Id, role: 'spiritmender', status: 'failed' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [ps1, cw1, cw2, lb1, w1, sm1, sp1],
      });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const { status, workItems } = proxy.getLastPersistedQuest();

      expect(status).toBe('paused');
      expect(workItems).toStrictEqual([
        WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' }),
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [ps1Id] }),
        WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending', dependsOn: [ps1Id] }),
        WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending', dependsOn: [cw1Id] }),
        WorkItemStub({
          id: w1Id,
          role: 'ward',
          status: 'complete',
          spawnerType: 'command',
          dependsOn: [cw1Id],
        }),
        WorkItemStub({ id: sm1Id, role: 'siegemaster', status: 'pending', dependsOn: [w1Id] }),
        WorkItemStub({ id: sp1Id, role: 'spiritmender', status: 'failed' }),
      ]);
    });

    it('VALID: {no in_progress items} => quest still transitions to paused, items unchanged', async () => {
      const questId = QuestIdStub({ value: 'pause-no-ip' });
      const ps1Id = QuestWorkItemIdStub({ value: 'ab000000-0000-0000-0000-000000000001' });
      const cw1Id = QuestWorkItemIdStub({ value: 'ab000000-0000-0000-0000-000000000002' });
      const ps1 = WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' });
      const cw1 = WorkItemStub({
        id: cw1Id,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [ps1Id],
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [ps1, cw1] });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const { status, workItems } = proxy.getLastPersistedQuest();

      expect(status).toBe('paused');
      expect(workItems).toStrictEqual([
        WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' }),
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending', dependsOn: [ps1Id] }),
      ]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest not found} => throws error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent' });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Quest not found/u);
    });
  });
});
