import { QuestWorkItemIdStub, SessionIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

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

    it('VALID: {completed chaos + in_progress glyph} => returns glyph', () => {
      const chaosSession = SessionIdStub({ value: 'session-chaos-1' });
      const glyphSession = SessionIdStub({ value: 'session-glyph-1' });

      const completedChaos = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'complete',
        sessionId: chaosSession,
        completedAt: '2024-01-15T10:00:00.000Z',
      });
      const activeGlyph = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        role: 'glyphsmith',
        status: 'in_progress',
        sessionId: glyphSession,
      });

      const result = questActiveSessionTransformer({
        workItems: [completedChaos, activeGlyph],
      });

      expect(result).toStrictEqual({
        sessionId: glyphSession,
        role: 'glyphsmith',
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
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
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
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
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
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
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
