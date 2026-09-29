import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { questActiveSessionTransformer } from './quest-active-session-transformer';

describe('questActiveSessionTransformer', () => {
  describe('no chat items', () => {
    it('EMPTY: {workItems: []} => undefined', () => {
      const result = questActiveSessionTransformer({ workItems: [] });

      expect(result).toStrictEqual({
        sessionId: undefined,
        role: undefined,
      });
    });

    it('EMPTY: {non-chat items without sessionId} => undefined', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'codeweaver',
        status: 'in_progress',
      });

      const result = questActiveSessionTransformer({ workItems: [item] });

      expect(result).toStrictEqual({
        sessionId: undefined,
        role: undefined,
      });
    });
  });

  describe('active in_progress chat', () => {
    it('VALID: {in_progress chaos with sessionId} => returns it', () => {
      const sessionId = SessionIdStub({ value: 'session-chaos-1' });
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'in_progress',
        sessionId,
      });

      const result = questActiveSessionTransformer({ workItems: [item] });

      expect(result).toStrictEqual({
        sessionId,
        role: 'chaoswhisperer',
      });
    });

    it('VALID: {completed chaos + in_progress bughunt} => returns bughunt', () => {
      const chaosSession = SessionIdStub({ value: 'session-chaos-1' });
      const bughuntSession = SessionIdStub({ value: 'session-bughunt-1' });

      const completedChaos = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'complete',
        sessionId: chaosSession,
        completedAt: '2024-01-15T10:00:00.000Z',
      });
      const activeBughunt = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
        role: 'bughunt',
        status: 'in_progress',
        sessionId: bughuntSession,
      });

      const result = questActiveSessionTransformer({
        workItems: [completedChaos, activeBughunt],
      });

      expect(result).toStrictEqual({
        sessionId: bughuntSession,
        role: 'bughunt',
      });
    });
  });

  describe('fallback to completed chat', () => {
    it('VALID: {multiple completed chaos} => returns most recent by completedAt', () => {
      const olderSession = SessionIdStub({ value: 'session-old' });
      const newerSession = SessionIdStub({ value: 'session-new' });

      const olderChaos = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'complete',
        sessionId: olderSession,
        completedAt: '2024-01-15T10:00:00.000Z',
      });
      const newerChaos = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
        role: 'chaoswhisperer',
        status: 'complete',
        sessionId: newerSession,
        completedAt: '2024-01-15T12:00:00.000Z',
      });

      const result = questActiveSessionTransformer({
        workItems: [olderChaos, newerChaos],
      });

      expect(result).toStrictEqual({
        sessionId: newerSession,
        role: 'chaoswhisperer',
      });
    });
  });

  describe('chaos without sessionId', () => {
    it('EDGE: {chaos with no sessionId} => skipped', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'in_progress',
      });

      const result = questActiveSessionTransformer({ workItems: [item] });

      expect(result).toStrictEqual({
        sessionId: undefined,
        role: undefined,
      });
    });
  });

  describe('non-chat fallback (smoketest quests)', () => {
    it('VALID: {only in_progress codeweaver with sessionId} => returns codeweaver session', () => {
      const sessionId = SessionIdStub({ value: 'session-cw-1' });
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'codeweaver',
        status: 'in_progress',
        sessionId,
      });

      const result = questActiveSessionTransformer({ workItems: [item] });

      expect(result).toStrictEqual({
        sessionId,
        role: 'codeweaver',
      });
    });

    it('VALID: {completed codeweavers, none active} => returns most recent by completedAt', () => {
      const oldSession = SessionIdStub({ value: 'session-old' });
      const newSession = SessionIdStub({ value: 'session-new' });
      const olderItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'codeweaver',
        status: 'complete',
        sessionId: oldSession,
        completedAt: '2024-01-15T10:00:00.000Z',
      });
      const newerItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
        role: 'codeweaver',
        status: 'complete',
        sessionId: newSession,
        completedAt: '2024-01-15T12:00:00.000Z',
      });

      const result = questActiveSessionTransformer({
        workItems: [olderItem, newerItem],
      });

      expect(result).toStrictEqual({
        sessionId: newSession,
        role: 'codeweaver',
      });
    });

    it('VALID: {chat work item without sessionId + non-chat with sessionId} => prefers non-chat', () => {
      const sessionId = SessionIdStub({ value: 'session-cw-1' });
      const chaos = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const cw = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
        role: 'codeweaver',
        status: 'in_progress',
        sessionId,
      });

      const result = questActiveSessionTransformer({ workItems: [chaos, cw] });

      expect(result).toStrictEqual({
        sessionId,
        role: 'codeweaver',
      });
    });
  });
});
