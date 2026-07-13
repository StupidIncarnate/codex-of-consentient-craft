import { RelatedDataItemStub } from '../related-data-item/related-data-item.stub';
import { workItemContract } from './work-item-contract';
import { WorkItemStub } from './work-item.stub';

describe('workItemContract', () => {
  describe('valid work items', () => {
    it('VALID: minimal work item => parses successfully', () => {
      const item = WorkItemStub();

      const result = workItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        spawnerType: 'agent',
        relatedDataItems: [],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: work item with all fields => parses successfully', () => {
      const item = WorkItemStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        role: 'ward',
        status: 'complete',
        spawnerType: 'command',
        sessionId: 'session-abc',
        relatedDataItems: ['operations/f47ac10b-58cc-4372-a567-0e02b2c3d479'],
        dependsOn: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
        attempt: 1,
        maxAttempts: 3,
        retryCount: 2,
        lastWardRunId: '1739625600000-a3f1.jsonl',
        createdAt: '2024-01-15T10:00:00.000Z',
        startedAt: '2024-01-15T10:01:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        errorMessage: 'verification_failed',
        summary: 'Implemented user fetch with tests',
        insertedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        wardMode: 'changed',
      });

      const result = workItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        role: 'ward',
        status: 'complete',
        spawnerType: 'command',
        sessionId: 'session-abc',
        relatedDataItems: ['operations/f47ac10b-58cc-4372-a567-0e02b2c3d479'],
        dependsOn: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
        attempt: 1,
        maxAttempts: 3,
        retryCount: 2,
        lastWardRunId: '1739625600000-a3f1.jsonl',
        createdAt: '2024-01-15T10:00:00.000Z',
        startedAt: '2024-01-15T10:01:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        errorMessage: 'verification_failed',
        summary: 'Implemented user fetch with tests',
        insertedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        wardMode: 'changed',
      });
    });

    it('VALID: sub-agent work item with agentId => parses successfully', () => {
      const item = WorkItemStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        role: 'codeweaver',
        status: 'in_progress',
        sessionId: '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402',
        agentId: 'acd35f7b7763e33e8',
      });

      const result = workItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        role: 'codeweaver',
        status: 'in_progress',
        spawnerType: 'agent',
        sessionId: '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402',
        agentId: 'acd35f7b7763e33e8',
        relatedDataItems: [],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: ward item with wardMode full => parses successfully', () => {
      const item = WorkItemStub({
        role: 'ward',
        spawnerType: 'command',
        wardMode: 'full',
      });

      const result = workItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'ward',
        status: 'pending',
        spawnerType: 'command',
        relatedDataItems: [],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00.000Z',
        wardMode: 'full',
      });
    });

    it('VALID: work item with relatedDataItems => parses successfully', () => {
      const ref = RelatedDataItemStub({
        value: 'wardResults/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      });
      const item = WorkItemStub({
        role: 'spiritmender',
        relatedDataItems: [ref],
      });

      const result = workItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'spiritmender',
        status: 'pending',
        spawnerType: 'agent',
        relatedDataItems: ['wardResults/a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: codeweaver linked to an operation item => parses successfully', () => {
      const item = WorkItemStub({
        role: 'codeweaver',
        relatedDataItems: ['operations/a1b2c3d4-58cc-4372-a567-0e02b2c3d479'],
      });

      const result = workItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        spawnerType: 'agent',
        relatedDataItems: ['operations/a1b2c3d4-58cc-4372-a567-0e02b2c3d479'],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: recovered item with resume marker => parses with resume true and retained sessionId', () => {
      const item = WorkItemStub({
        role: 'codeweaver',
        status: 'pending',
        resume: true,
        sessionId: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
      });

      const result = workItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        spawnerType: 'agent',
        sessionId: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
        relatedDataItems: [],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00.000Z',
        resume: true,
      });
    });

    it('VALID: without optional arrays => defaults to empty arrays', () => {
      const result = workItemContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        spawnerType: 'agent',
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        spawnerType: 'agent',
        relatedDataItems: [],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid work items', () => {
    it('INVALID: {missing required fields} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {non-uuid id} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'not-a-uuid',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {unknown role} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'unknown',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {unknown status} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'unknown',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {invalid createdAt timestamp} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {invalid relatedDataItem format} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          relatedDataItems: ['invalid-format'],
        });
      }).toThrow(/Must be \{collection\}\/\{id\}/u);
    });

    it('INVALID: {invalid wardMode} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'invalid',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {negative attempt} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          attempt: -1,
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {zero maxAttempts} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          maxAttempts: 0,
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {unknown smoketestExpectedSignal} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          smoketestExpectedSignal: 'not-a-real-signal',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {empty agentId} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          agentId: '',
        });
      }).toThrow(/too_small|String must contain at least 1/u);
    });

    it('INVALID: {unknown actualSignal} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          actualSignal: 'bogus',
        });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('signal fields', () => {
    it('VALID: {smoketestExpectedSignal=complete, actualSignal=complete} => parses successfully', () => {
      const result = workItemContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'complete',
        spawnerType: 'agent',
        createdAt: '2024-01-15T10:00:00.000Z',
        smoketestExpectedSignal: 'complete',
        actualSignal: 'complete',
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'complete',
        spawnerType: 'agent',
        relatedDataItems: [],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00.000Z',
        smoketestExpectedSignal: 'complete',
        actualSignal: 'complete',
      });
    });

    it('INVALID: {actualSignal=failed-replan} => throws validation error (removed signal kind)', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'failed',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          actualSignal: 'failed-replan',
        });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('retry and ward run tracking', () => {
    it('VALID: {retryCount: 3} => parses successfully', () => {
      const item = WorkItemStub({ retryCount: 3 });

      const result = workItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        spawnerType: 'agent',
        relatedDataItems: [],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 3,
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {lastWardRunId: file name} => parses successfully', () => {
      const item = WorkItemStub({ lastWardRunId: '1739625600000-a3f1.jsonl' });

      const result = workItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        spawnerType: 'agent',
        relatedDataItems: [],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        lastWardRunId: '1739625600000-a3f1.jsonl',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('INVALID: {retryCount: -1} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          retryCount: -1,
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {retryCount: 1.5} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          retryCount: 1.5,
        });
      }).toThrow(/integer/u);
    });
  });
});
