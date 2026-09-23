import {
  ModifyQuestInputStub,
  OperationPlanStub,
  QuestBlightLedgerEntryStub,
  QuestNoteStub,
  UnitObservationStub,
} from '@dungeonmaster/shared/contracts';

import { questInputServerTimestampsTransformer } from './quest-input-server-timestamps-transformer';

// The server's reading, distinguishable at a glance from every stub's own default.
const { at: STAMPED_AT } = UnitObservationStub({ at: '2026-08-16T03:23:41.000Z' });
const SERVER_INSTANT = '2026-08-16T03:23:41.000Z';
const CLIENT_INSTANT = '2020-01-01T00:00:00.000Z';

describe('questInputServerTimestampsTransformer', () => {
  describe("flows are not this transformer's concern", () => {
    it("EMPTY: {a flow patch, no planningNotes} => comes back unchanged, because a unit's mark lives on workItem.observations[], not on the flow", () => {
      const result = questInputServerTimestampsTransformer({
        input: ModifyQuestInputStub({
          questId: 'add-auth',
          flows: [{ id: 'login-flow', nodes: [{ id: 'submit-form', label: 'Submit' }] }] as never,
        }),
        at: STAMPED_AT,
      });

      expect(result.flows).toStrictEqual([
        { id: 'login-flow', nodes: [{ id: 'submit-form', label: 'Submit' }] },
      ]);
    });
  });

  describe('planning notes', () => {
    it("VALID: {blightLedger entry carrying the caller's createdAt} => comes back carrying the server instant", () => {
      const result = questInputServerTimestampsTransformer({
        input: ModifyQuestInputStub({
          questId: 'add-auth',
          planningNotes: {
            blightLedger: [QuestBlightLedgerEntryStub({ createdAt: CLIENT_INSTANT })],
          },
        }),
        at: STAMPED_AT,
      });

      expect(result.planningNotes).toStrictEqual({
        blightLedger: [QuestBlightLedgerEntryStub({ createdAt: SERVER_INSTANT })],
      });
    });

    it("VALID: {questNote carrying the caller's at} => comes back carrying the server instant", () => {
      const result = questInputServerTimestampsTransformer({
        input: ModifyQuestInputStub({
          questId: 'add-auth',
          planningNotes: { questNotes: [QuestNoteStub({ at: CLIENT_INSTANT })] },
        }),
        at: STAMPED_AT,
      });

      expect(result.planningNotes).toStrictEqual({
        questNotes: [QuestNoteStub({ at: SERVER_INSTANT })],
      });
    });

    it("VALID: {operationPlan carrying the caller's at} => comes back carrying the server instant", () => {
      const result = questInputServerTimestampsTransformer({
        input: ModifyQuestInputStub({
          questId: 'add-auth',
          planningNotes: { operationPlans: [OperationPlanStub({ at: CLIENT_INSTANT })] },
        }),
        at: STAMPED_AT,
      });

      expect(result.planningNotes).toStrictEqual({
        operationPlans: [OperationPlanStub({ at: SERVER_INSTANT })],
      });
    });

    it('EMPTY: {blightLedger: [], the no-op payload} => comes back as the empty array, with nothing invented to stamp', () => {
      const result = questInputServerTimestampsTransformer({
        input: ModifyQuestInputStub({
          questId: 'add-auth',
          planningNotes: { blightLedger: [] },
        }),
        at: STAMPED_AT,
      });

      expect(result.planningNotes).toStrictEqual({ blightLedger: [] });
    });
  });

  describe('a payload with nothing to stamp', () => {
    it('EMPTY: {a title-only write} => comes back byte-identical, so no unrelated write re-dates anything', () => {
      const input = ModifyQuestInputStub({ questId: 'add-auth', title: 'Add Authentication' });

      expect(questInputServerTimestampsTransformer({ input, at: STAMPED_AT })).toStrictEqual(input);
    });
  });
});
