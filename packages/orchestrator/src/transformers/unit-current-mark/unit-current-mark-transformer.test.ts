import {
  QuestStub,
  UnitIdStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { unitCurrentMarkTransformer } from './unit-current-mark-transformer';

const WORK_ITEM_1 = '11111111-1111-4111-8111-111111111111';
const WORK_ITEM_2 = '22222222-2222-4222-8222-222222222222';
const WORK_ITEM_3 = '33333333-3333-4333-8333-333333333333';
const OBS_3 = 'send-flow:observable:obs-3';
const OBS_7 = 'send-flow:observable:obs-7';

describe('unitCurrentMarkTransformer', () => {
  describe('the mark on the most recent work item assigned the unit', () => {
    it('VALID: {wi1 marks obs-3 and obs-7 met, wi2 marks only obs-7 unmet} => obs-3 is still wi1 met', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            payload: { units: [{ unitId: OBS_3 }, { unitId: OBS_7 }] },
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'met',
                evidence: 'packages/x/src/badge-widget.test.tsx:42 — reads 0 when the count is two',
                at: '2026-01-01T00:00:00.000Z',
              }),
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
        unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual({
        unitId: OBS_3,
        mark: 'met',
        evidence: 'packages/x/src/badge-widget.test.tsx:42 — reads 0 when the count is two',
        workItemId: WORK_ITEM_1,
        step: 'work',
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it('VALID: {wi1 marks obs-7 met, wi2 marks obs-7 unmet} => obs-7 is wi2 unmet', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            payload: { units: [{ unitId: OBS_7 }] },
            observations: [
              UnitObservationStub({ unitId: OBS_7, mark: 'met', at: '2026-01-01T00:01:00.000Z' }),
            ],
          }),
          WorkItemStub({
            id: WORK_ITEM_2,
            step: 'review',
            payload: { units: [{ unitId: OBS_7 }] },
            observations: [
              UnitObservationStub({
                unitId: OBS_7,
                mark: 'unmet',
                evidence: 'the reviewer re-ran the walk and the badge still read 0',
                at: '2026-01-02T00:00:00.000Z',
              }),
            ],
          }),
        ],
      });

      expect(
        unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_7 }) }),
      ).toStrictEqual({
        unitId: OBS_7,
        mark: 'unmet',
        evidence: 'the reviewer re-ran the walk and the badge still read 0',
        workItemId: WORK_ITEM_2,
        step: 'review',
        at: '2026-01-02T00:00:00.000Z',
      });
    });
  });

  describe('assignment is the key, not the mark', () => {
    it('EMPTY: {wi1 assigned obs-3 in its payload, observations empty} => returns null, since that session died without marking it', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [],
          }),
        ],
      });

      expect(unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) })).toBe(
        null,
      );
    });

    it('EMPTY: {wi1 marks obs-3 met, wi2 assigned obs-3 marks nothing} => returns null, not wi1 met', () => {
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

      expect(unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) })).toBe(
        null,
      );
    });
  });

  describe('nobody has been handed the unit', () => {
    it('EMPTY: {no work items} => returns null rather than throwing', () => {
      expect(
        unitCurrentMarkTransformer({
          quest: QuestStub({ workItems: [] }),
          unitId: UnitIdStub({ value: OBS_3 }),
        }),
      ).toBe(null);
    });

    it('EMPTY: {every work item is about obs-7} => returns null for obs-3', () => {
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

      expect(unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) })).toBe(
        null,
      );
    });
  });

  describe('reading the assignment off a work item', () => {
    it('VALID: {no payload at all} => the observations still count, which is every quest.json on disk', () => {
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
        unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual({
        unitId: OBS_3,
        mark: 'met',
        evidence: 'packages/x/src/badge-widget.test.tsx:42 — reads 0 when the count is two',
        workItemId: WORK_ITEM_1,
        step: 'work',
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it('VALID: {payload with no units key, no observations} => contributes nothing, so the unit reads as never handed out', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            payload: { recipeId: 'codeweaver-unit' },
            observations: [],
          }),
        ],
      });

      expect(unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) })).toBe(
        null,
      );
    });

    it('VALID: {payload names obs-7 but the session marked obs-3} => the mark still counts, since the two reads are a union', () => {
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
        unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual({
        unitId: OBS_3,
        mark: 'unmet',
        evidence: 'the badge still reads 0 while two comments are persisted',
        workItemId: WORK_ITEM_1,
        step: 'work',
        at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('the fields it carries through', () => {
    it("VALID: {mark: 'cant-meet' with toSettle} => the instruction rides along", () => {
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
        unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual({
        unitId: OBS_3,
        mark: 'cant-meet',
        evidence: 'no layer below the browser reaches the rendered badge',
        toSettle: 'drive a real send through a live quest and read the session JSONL',
        workItemId: WORK_ITEM_1,
        step: 'work',
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it('VALID: {a chat-role work item with no step} => the result carries no step key', () => {
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
        unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual({
        unitId: OBS_3,
        mark: 'met',
        evidence: 'the user confirmed the badge read 2 while walking the draft',
        workItemId: WORK_ITEM_1,
        at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('ordering is array position, never a timestamp', () => {
    it('EDGE: {a parallel batch sharing one createdAt} => the LAST work item in the array wins', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_1,
            step: 'work',
            createdAt: '2026-01-01T00:00:00.000Z',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [
              UnitObservationStub({ unitId: OBS_3, mark: 'met', at: '2026-01-01T00:00:00.000Z' }),
            ],
          }),
          WorkItemStub({
            id: WORK_ITEM_2,
            step: 'work',
            createdAt: '2026-01-01T00:00:00.000Z',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [
              UnitObservationStub({ unitId: OBS_3, mark: 'met', at: '2026-01-01T00:00:00.000Z' }),
            ],
          }),
          WorkItemStub({
            id: WORK_ITEM_3,
            step: 'work',
            createdAt: '2026-01-01T00:00:00.000Z',
            payload: { units: [{ unitId: OBS_3 }] },
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'unmet',
                evidence: 'the third of three parallel sessions found the badge still reading 0',
                at: '2026-01-01T00:00:00.000Z',
              }),
            ],
          }),
        ],
      });

      expect(
        unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) }),
      ).toStrictEqual({
        unitId: OBS_3,
        mark: 'unmet',
        evidence: 'the third of three parallel sessions found the badge still reading 0',
        workItemId: WORK_ITEM_3,
        step: 'work',
        at: '2026-01-01T00:00:00.000Z',
      });
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

      unitCurrentMarkTransformer({ quest, unitId: UnitIdStub({ value: OBS_3 }) });

      expect(JSON.stringify(quest)).toBe(before);
    });
  });
});
