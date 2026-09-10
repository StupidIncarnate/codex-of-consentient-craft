import { QuestStub } from '../quest/quest.stub';
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
        wardMode: 'committed',
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
        wardMode: 'committed',
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

    it('VALID: {packageNames copied from the operation item} => parses and keeps the slice', () => {
      const item = WorkItemStub({
        role: 'flowrider',
        packageNames: ['web', 'server'],
      });

      const result = workItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'flowrider',
        status: 'pending',
        spawnerType: 'agent',
        relatedDataItems: [],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00.000Z',
        packageNames: ['web', 'server'],
      });
    });

    it("VALID: {startRef stamped at the first prompt fetch} => parses and keeps the item's fork point", () => {
      const item = WorkItemStub({
        role: 'codeweaver',
        status: 'in_progress',
        startRef: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      });

      const result = workItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'in_progress',
        spawnerType: 'agent',
        relatedDataItems: [],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00.000Z',
        startRef: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      });
    });

    // The field is deliberately `.optional()` with NO `.default()`: a default would make it
    // REQUIRED on the parsed type and materialise a key onto every one of the most numerous array
    // on a quest. An absent startRef is what the signal-back review-coverage gate reads as "this
    // item has no range to measure", so absence has to survive a round-trip as absence.
    it('EMPTY: {no startRef} => the key is absent rather than defaulted', () => {
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

    it('EMPTY: {no packageNames} => the key is absent rather than defaulted to an empty array', () => {
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

    // `.string().datetime()` with no `{ offset: true }` accepts ONLY a bare `Z` suffix — an
    // offset-suffixed value (a producer that formats local time instead of normalizing to UTC)
    // fails the whole quest.json parse here, before the elapsed-duration row logic ever sees it.
    it('INVALID: {completedAt with a +05:00 offset instead of Z} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          startedAt: '2024-01-15T10:01:00.000Z',
          completedAt: '2026-01-01T11:56:00.000+05:00',
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

    it('INVALID: {empty startRef} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          startRef: '',
        });
      }).toThrow(/too_small|String must contain at least 1/u);
    });

    it('INVALID: {empty packageNames member} => throws validation error', () => {
      expect(() => {
        workItemContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          createdAt: '2024-01-15T10:00:00.000Z',
          packageNames: [''],
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

  describe('startedAt tolerates an explicit null without throwing', () => {
    // Observed live: a quest.json seeded with `startedAt: null` (not omitted) fails THIS parse —
    // `workItemContract` uses `.optional()`, which accepts `undefined` but rejects `null` outright
    // — and the responder that loads quest.json has no per-item recovery, so the zod throw here
    // becomes a `quest-load-failed` WS event for the WHOLE quest: every row in the execution panel
    // renders blank, not just this one's duration figure. `.nullish()` accepts the null instead of
    // throwing. It stays `null` in the parsed result rather than being erased back to an omitted
    // key: the elapsed-duration row's own gate is `startedAt && elapsedEndPoint`, and `null` is
    // already falsy there, so a null-valued field behaves exactly like an absent one downstream
    // with no need for `workItemContract` to reshape zod's own output.
    it('VALID: {startedAt: null} => parses without throwing, keeping null as a falsy value', () => {
      const result = workItemContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'in_progress',
        spawnerType: 'agent',
        createdAt: '2024-01-15T10:00:00.000Z',
        startedAt: null as never,
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'in_progress',
        spawnerType: 'agent',
        relatedDataItems: [],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00.000Z',
        startedAt: null,
      });
      expect(Boolean(result.startedAt)).toBe(false);
    });
  });

  describe('completedAt tolerates an explicit null without throwing', () => {
    // Same shape as the startedAt block above, on the sibling field the running-elapsed-duration
    // row's own force condition turns on: a P2 work item (status other than in_progress, a real
    // startedAt, `completedAt` present but explicitly null rather than omitted). `workItemContract`
    // uses `.optional()` on completedAt too, which accepts `undefined` but rejects `null` outright,
    // so this shape hits the same whole-quest `quest-load-failed` failure the startedAt block
    // documents. `.nullish()` accepts the null instead of throwing, and it stays `null` in the
    // parsed result — the row's force condition treats a falsy `completedAt` the same whether it
    // is `null` or absent, so there is nothing downstream for `workItemContract` to normalize.
    it('VALID: {completedAt: null} => parses without throwing, keeping null as a falsy value', () => {
      const result = workItemContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        spawnerType: 'agent',
        createdAt: '2024-01-15T10:00:00.000Z',
        startedAt: '2024-01-15T10:01:00.000Z',
        completedAt: null as never,
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
        startedAt: '2024-01-15T10:01:00.000Z',
        completedAt: null,
      });
      expect(Boolean(result.completedAt)).toBe(false);
    });
  });

  describe('a null startedAt inside a whole quest parse (the path that actually blanked the panel)', () => {
    // `questContract.workItems` is `z.array(workItemContract)`, so parsing a QUEST routes each
    // work item through zod's own internal element-parse, not through a direct
    // `workItemContract.parse()` call — a field-level test alone cannot prove the fix covers this
    // path. This is exactly where the reported symptom happened: one work item with
    // `startedAt: null` failed the array-element parse, which failed the whole `questContract`
    // parse, which is what the responder surfaced as `quest-load-failed` for the ENTIRE quest —
    // every row blank, not just this one's duration.
    it('VALID: {a quest whose only work item has startedAt: null} => the whole quest still parses', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            status: 'in_progress',
            startedAt: null,
          }),
        ],
      });

      expect(quest.workItems).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'in_progress',
          spawnerType: 'agent',
          relatedDataItems: [],
          dependsOn: [],
          attempt: 0,
          maxAttempts: 1,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          startedAt: null,
        },
      ]);
      expect(quest.workItems.every((item) => !item.startedAt)).toBe(true);
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
