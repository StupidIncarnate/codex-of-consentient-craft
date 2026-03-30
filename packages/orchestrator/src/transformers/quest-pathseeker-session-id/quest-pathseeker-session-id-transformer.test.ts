import { QuestWorkItemIdStub, SessionIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { questPathseekerSessionIdTransformer } from './quest-pathseeker-session-id-transformer';

describe('questPathseekerSessionIdTransformer', () => {
  describe('no pathseeker items', () => {
    it('EMPTY: {workItems: []} => undefined', () => {
      const result = questPathseekerSessionIdTransformer({ workItems: [] });

      expect(result).toStrictEqual(undefined);
    });

    it('EMPTY: {only non-pathseeker items} => undefined', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'codeweaver',
        status: 'complete',
        sessionId: SessionIdStub({ value: 'session-codeweaver' }),
      });

      const result = questPathseekerSessionIdTransformer({ workItems: [item] });

      expect(result).toStrictEqual(undefined);
    });
  });

  describe('pathseeker without sessionId', () => {
    it('EDGE: {pathseeker with no sessionId} => undefined', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'pathseeker',
        status: 'pending',
      });

      const result = questPathseekerSessionIdTransformer({ workItems: [item] });

      expect(result).toStrictEqual(undefined);
    });
  });

  describe('single pathseeker with sessionId', () => {
    it('VALID: {one pathseeker with sessionId} => returns sessionId', () => {
      const sessionId = SessionIdStub({ value: 'session-ps-1' });
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'pathseeker',
        status: 'complete',
        sessionId,
      });

      const result = questPathseekerSessionIdTransformer({ workItems: [item] });

      expect(result).toStrictEqual(sessionId);
    });
  });

  describe('multiple pathseekers', () => {
    it('VALID: {multiple pathseekers} => returns earliest by createdAt', () => {
      const earlierSession = SessionIdStub({ value: 'session-ps-first' });
      const laterSession = SessionIdStub({ value: 'session-ps-second' });

      const earlierItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'pathseeker',
        status: 'complete',
        sessionId: earlierSession,
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const laterItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        role: 'pathseeker',
        status: 'complete',
        sessionId: laterSession,
        createdAt: '2024-01-15T12:00:00.000Z',
      });

      const result = questPathseekerSessionIdTransformer({
        workItems: [laterItem, earlierItem],
      });

      expect(result).toStrictEqual(earlierSession);
    });

    it('VALID: {first pathseeker no session, later one has session} => returns later sessionId', () => {
      const laterSession = SessionIdStub({ value: 'session-ps-second' });

      const earlierItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'pathseeker',
        status: 'failed',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const laterItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        role: 'pathseeker',
        status: 'complete',
        sessionId: laterSession,
        createdAt: '2024-01-15T12:00:00.000Z',
      });

      const result = questPathseekerSessionIdTransformer({
        workItems: [earlierItem, laterItem],
      });

      expect(result).toStrictEqual(laterSession);
    });
  });

  describe('mixed roles', () => {
    it('VALID: {codeweaver with session + pathseeker with session} => returns pathseeker session', () => {
      const codeweaverSession = SessionIdStub({ value: 'session-cw' });
      const pathseekerSession = SessionIdStub({ value: 'session-ps' });

      const codeweaverItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'codeweaver',
        status: 'complete',
        sessionId: codeweaverSession,
        createdAt: '2024-01-15T09:00:00.000Z',
      });
      const pathseekerItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        role: 'pathseeker',
        status: 'complete',
        sessionId: pathseekerSession,
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      const result = questPathseekerSessionIdTransformer({
        workItems: [codeweaverItem, pathseekerItem],
      });

      expect(result).toStrictEqual(pathseekerSession);
    });
  });
});
