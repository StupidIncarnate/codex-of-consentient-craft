import {
  QuestStub,
  UnitIdStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { unitMarkChurnTransformer } from './unit-mark-churn-transformer';

const WORK_ITEM_1 = '11111111-1111-4111-8111-111111111111';
const WORK_ITEM_2 = '22222222-2222-4222-8222-222222222222';
const WORK_ITEM_3 = '33333333-3333-4333-8333-333333333333';
const WORK_ITEM_4 = '44444444-4444-4444-8444-444444444444';
const OBS_3 = 'send-flow:observable:obs-3';
const OBS_7 = 'send-flow:observable:obs-7';

describe('unitMarkChurnTransformer', () => {
  describe('the whole history, oldest first', () => {
    it('VALID: {four work items marking obs-3 met, met, unmet, met} => every entry reads back in order', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'met',
                evidence: 'packages/x/src/badge-widget.test.tsx:42 — reads 0 when the count is two',
                at: '2026-01-01T00:00:00.000Z',
              }),
            ],
          }),
          WorkItemStub({
            id: WORK_ITEM_2,
            step: 'review',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'met',
                evidence: 'the reviewer re-ran that file alone and it still bit',
                at: '2026-01-02T00:00:00.000Z',
              }),
            ],
          }),
          WorkItemStub({
            id: WORK_ITEM_3,
            step: 'walk',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'unmet',
                evidence: 'the live walk showed the badge reading 0 with two comments persisted',
                at: '2026-01-03T00:00:00.000Z',
              }),
            ],
          }),
          WorkItemStub({
            id: WORK_ITEM_4,
            step: 'work',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'met',
                evidence: 'packages/x/src/badge-widget.test.tsx:58 — the fix turns it green',
                at: '2026-01-04T00:00:00.000Z',
              }),
            ],
          }),
        ],
      });

      const result = unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) });

      expect(result.map((entry) => entry.mark)).toStrictEqual(['met', 'met', 'unmet', 'met']);
      expect(result).toStrictEqual([
        {
          workItemId: WORK_ITEM_1,
          step: 'work',
          mark: 'met',
          evidence: 'packages/x/src/badge-widget.test.tsx:42 — reads 0 when the count is two',
          toSettle: null,
          at: '2026-01-01T00:00:00.000Z',
        },
        {
          workItemId: WORK_ITEM_2,
          step: 'review',
          mark: 'met',
          evidence: 'the reviewer re-ran that file alone and it still bit',
          toSettle: null,
          at: '2026-01-02T00:00:00.000Z',
        },
        {
          workItemId: WORK_ITEM_3,
          step: 'walk',
          mark: 'unmet',
          evidence: 'the live walk showed the badge reading 0 with two comments persisted',
          toSettle: null,
          at: '2026-01-03T00:00:00.000Z',
        },
        {
          workItemId: WORK_ITEM_4,
          step: 'work',
          mark: 'met',
          evidence: 'packages/x/src/badge-widget.test.tsx:58 — the fix turns it green',
          toSettle: null,
          at: '2026-01-04T00:00:00.000Z',
        },
      ]);
    });

    it('VALID: {wi1 marks obs-3 and obs-7, wi2 marks only obs-7} => obs-3 has one entry and obs-7 has two', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            payload: { units: [{ unitId: OBS_3 }, { unitId: OBS_7 }] },
            observations: [
              UnitObservationStub({ unitId: OBS_3, mark: 'met', at: '2026-01-01T00:00:00.000Z' }),
              UnitObservationStub({ unitId: OBS_7, mark: 'met', at: '2026-01-01T00:01:00.000Z' }),
            ],
          }),
          WorkItemStub({
            id: WORK_ITEM_2,
            step: 'review',
            payload: { units: [{ unitId: OBS_7 }] },
            observations: [
              UnitObservationStub({ unitId: OBS_7, mark: 'unmet', at: '2026-01-02T00:00:00.000Z' }),
            ],
          }),
        ],
      });

      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }).map(
          (entry) => entry.workItemId,
        ),
      ).toStrictEqual([WORK_ITEM_1]);
      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_7 }) }).map(
          (entry) => entry.workItemId,
        ),
      ).toStrictEqual([WORK_ITEM_1, WORK_ITEM_2]);
    });
  });

  describe('a session that was handed the unit and never marked it', () => {
    it('EMPTY: {wi1 assigned obs-3 in its payload, observations empty} => one entry with mark null', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            createdAt: '2026-01-01T00:00:00.000Z',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [],
          }),
        ],
      });

      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual([
        {
          workItemId: WORK_ITEM_1,
          step: 'work',
          mark: null,
          evidence: null,
          toSettle: null,
          at: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('VALID: {wi1 marks obs-3 met, wi2 assigned it and marks nothing} => the crash shows as a trailing null row', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'met',
                evidence: 'packages/x/src/badge-widget.test.tsx:42 — reads 0 when the count is two',
                at: '2026-01-01T00:00:00.000Z',
              }),
            ],
          }),
          WorkItemStub({
            id: WORK_ITEM_2,
            step: 'review',
            createdAt: '2026-01-02T00:00:00.000Z',
            completedAt: '2026-01-02T03:00:00.000Z',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [],
          }),
        ],
      });

      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual([
        {
          workItemId: WORK_ITEM_1,
          step: 'work',
          mark: 'met',
          evidence: 'packages/x/src/badge-widget.test.tsx:42 — reads 0 when the count is two',
          toSettle: null,
          at: '2026-01-01T00:00:00.000Z',
        },
        {
          workItemId: WORK_ITEM_2,
          step: 'review',
          mark: null,
          evidence: null,
          toSettle: null,
          at: '2026-01-02T03:00:00.000Z',
        },
      ]);
    });

    it('VALID: {an unmarked assignment with no completedAt} => at falls back to createdAt', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            createdAt: '2026-01-05T09:30:00.000Z',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [],
          }),
        ],
      });

      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual([
        {
          workItemId: WORK_ITEM_1,
          step: 'work',
          mark: null,
          evidence: null,
          toSettle: null,
          at: '2026-01-05T09:30:00.000Z',
        },
      ]);
    });
  });

  describe('nobody has been handed the unit', () => {
    it('EMPTY: {no work items} => returns an empty walk', () => {
      expect(
        unitMarkChurnTransformer({
          quest: QuestStub({ workItems: [] }),
          unitId: UnitIdStub({ value: OBS_3 }),
        }),
      ).toStrictEqual([]);
    });

    it('EMPTY: {every work item is about obs-7} => returns an empty walk for obs-3', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            payload: { units: [{ unitId: OBS_7 }] },
            observations: [
              UnitObservationStub({ unitId: OBS_7, mark: 'met', at: '2026-01-01T00:00:00.000Z' }),
            ],
          }),
        ],
      });

      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual([]);
    });
  });

  describe('reading the assignment off a work item', () => {
    it('VALID: {no payload at all} => the observations still make a row, which is every quest.json on disk', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'met',
                evidence: 'packages/x/src/badge-widget.test.tsx:42 — reads 0 when the count is two',
                at: '2026-01-01T00:00:00.000Z',
              }),
            ],
          }),
        ],
      });

      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual([
        {
          workItemId: WORK_ITEM_1,
          step: 'work',
          mark: 'met',
          evidence: 'packages/x/src/badge-widget.test.tsx:42 — reads 0 when the count is two',
          toSettle: null,
          at: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('VALID: {payload with no units key, no observations} => contributes no row', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            payload: { recipeId: 'codeweaver-unit' },
            observations: [],
          }),
        ],
      });

      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual([]);
    });

    it('VALID: {payload names obs-7 but the session marked obs-3} => obs-3 still gets its row', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            payload: { units: [{ unitId: OBS_7 }] },
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'unmet',
                evidence: 'the badge still reads 0 while two comments are persisted',
                at: '2026-01-01T00:00:00.000Z',
              }),
            ],
          }),
        ],
      });

      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual([
        {
          workItemId: WORK_ITEM_1,
          step: 'work',
          mark: 'unmet',
          evidence: 'the badge still reads 0 while two comments are persisted',
          toSettle: null,
          at: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('the fields it carries through', () => {
    it("VALID: {mark: 'cant-meet' with toSettle} => the instruction rides on the entry", () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'cant-meet',
                evidence: 'no layer below the browser reaches the rendered badge',
                toSettle: 'drive a real send through a live quest and read the session JSONL',
                at: '2026-01-01T00:00:00.000Z',
              }),
            ],
          }),
        ],
      });

      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual([
        {
          workItemId: WORK_ITEM_1,
          step: 'work',
          mark: 'cant-meet',
          evidence: 'no layer below the browser reaches the rendered badge',
          toSettle: 'drive a real send through a live quest and read the session JSONL',
          at: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('VALID: {a chat-role work item with no step} => the entry carries step null', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            role: 'chaoswhisperer',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'met',
                evidence: 'the user confirmed the badge read 2 while walking the draft',
                at: '2026-01-01T00:00:00.000Z',
              }),
            ],
          }),
        ],
      });

      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual([
        {
          workItemId: WORK_ITEM_1,
          step: null,
          mark: 'met',
          evidence: 'the user confirmed the badge read 2 while walking the draft',
          toSettle: null,
          at: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('ordering is array position, never a timestamp', () => {
    it('EDGE: {a parallel batch sharing one createdAt} => the walk follows array order', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_3,
            step: 'work',
            createdAt: '2026-01-01T00:00:00.000Z',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [],
          }),
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            createdAt: '2026-01-01T00:00:00.000Z',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [],
          }),
          WorkItemStub({
            id: WORK_ITEM_2,
            step: 'work',
            createdAt: '2026-01-01T00:00:00.000Z',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [],
          }),
        ],
      });

      expect(
        unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }).map(
          (entry) => entry.workItemId,
        ),
      ).toStrictEqual([WORK_ITEM_3, WORK_ITEM_1, WORK_ITEM_2]);
    });
  });

  describe('purity', () => {
    it('VALID: {a quest with marks and an unmarked assignment} => nothing on the quest is mutated', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [
              UnitObservationStub({ unitId: OBS_3, mark: 'met', at: '2026-01-01T00:00:00.000Z' }),
            ],
          }),
          WorkItemStub({
            id: WORK_ITEM_2,
            step: 'review',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [],
          }),
        ],
      });
      const before = JSON.stringify(quest);

      unitMarkChurnTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) });

      expect(JSON.stringify(quest)).toBe(before);
    });
  });
});
