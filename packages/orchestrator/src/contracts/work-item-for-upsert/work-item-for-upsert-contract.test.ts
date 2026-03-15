import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { workItemForUpsertContract } from './work-item-for-upsert-contract';
import { WorkItemForUpsertStub } from './work-item-for-upsert.stub';

describe('workItemForUpsertContract', () => {
  describe('valid inputs', () => {
    it('VALID: {id only} => parses with only id required', () => {
      const id = QuestWorkItemIdStub();

      const result = workItemForUpsertContract.parse({ id });

      expect(result.id).toBe(id);
    });

    it('VALID: {id, status} => parses partial update with status', () => {
      const input = WorkItemForUpsertStub({ status: 'complete' });

      const result = workItemForUpsertContract.parse(input);

      expect(result.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(result.status).toBe('complete');
    });

    it('VALID: {id, sessionId} => parses partial update with sessionId', () => {
      const input = WorkItemForUpsertStub({ sessionId: 'session-abc-123' });

      const result = workItemForUpsertContract.parse(input);

      expect(result.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(result.sessionId).toBe('session-abc-123');
    });

    it('VALID: {id, status, completedAt} => parses partial update with multiple fields', () => {
      const input = WorkItemForUpsertStub({
        status: 'failed',
        completedAt: '2024-01-15T12:00:00.000Z',
        errorMessage: 'Agent exited without completing',
      });

      const result = workItemForUpsertContract.parse(input);

      expect(result.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(result.status).toBe('failed');
      expect(result.completedAt).toBe('2024-01-15T12:00:00.000Z');
      expect(result.errorMessage).toBe('Agent exited without completing');
    });

    it('VALID: {full work item fields} => parses complete work item', () => {
      const input = WorkItemForUpsertStub({
        role: 'codeweaver',
        status: 'pending',
        spawnerType: 'agent',
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      const result = workItemForUpsertContract.parse(input);

      expect(result.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(result.role).toBe('codeweaver');
      expect(result.status).toBe('pending');
      expect(result.spawnerType).toBe('agent');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_ID: {missing id} => throws validation error', () => {
      expect(() => {
        return workItemForUpsertContract.parse({ status: 'complete' });
      }).toThrow(/Required/u);
    });

    it('INVALID_ID: {id: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return workItemForUpsertContract.parse({ id: 'not-a-uuid' });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_STATUS: {id, status: "invalid"} => throws validation error', () => {
      expect(() => {
        return workItemForUpsertContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          status: 'invalid',
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
