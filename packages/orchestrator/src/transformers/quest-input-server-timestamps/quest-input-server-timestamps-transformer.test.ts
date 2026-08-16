import {
  ModifyQuestInputStub,
  OperationPlanStub,
  QuestBlightLedgerEntryStub,
  QuestNoteStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';

import { questInputServerTimestampsTransformer } from './quest-input-server-timestamps-transformer';

// The server's reading, distinguishable at a glance from every stub's own default.
const { at: STAMPED_AT } = SignoffStub({ at: '2026-08-16T03:23:41.000Z' });
const SERVER_INSTANT = '2026-08-16T03:23:41.000Z';
const CLIENT_INSTANT = '2020-01-01T00:00:00.000Z';

describe('questInputServerTimestampsTransformer', () => {
  describe('sign-offs on the flow graph', () => {
    it("VALID: {observable sign-off carrying the caller's at} => comes back carrying the server instant", () => {
      const result = questInputServerTimestampsTransformer({
        input: ModifyQuestInputStub({
          questId: 'add-auth',
          flows: [
            {
              id: 'login-flow',
              nodes: [
                {
                  id: 'submit-form',
                  observables: [
                    { id: 'redirects', flowriderSignoff: SignoffStub({ at: CLIENT_INSTANT }) },
                  ],
                },
              ],
            },
          ] as never,
        }),
        at: STAMPED_AT,
      });

      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          nodes: [
            {
              id: 'submit-form',
              observables: [
                { id: 'redirects', flowriderSignoff: SignoffStub({ at: SERVER_INSTANT }) },
              ],
            },
          ],
        },
      ]);
    });

    it('VALID: {node, edge and off-map sign-offs in one payload} => all three carry the server instant', () => {
      const result = questInputServerTimestampsTransformer({
        input: ModifyQuestInputStub({
          questId: 'add-auth',
          flows: [
            {
              id: 'login-flow',
              nodes: [
                { id: 'submit-form', siegemasterSignoff: SignoffStub({ at: CLIENT_INSTANT }) },
              ],
              edges: [
                {
                  id: 'submit-to-dashboard',
                  siegemasterSignoff: SignoffStub({ at: CLIENT_INSTANT }),
                },
              ],
              offMapSignoffs: [
                { id: 'concurrency', siegemasterSignoff: SignoffStub({ at: CLIENT_INSTANT }) },
              ],
            },
          ] as never,
        }),
        at: STAMPED_AT,
      });

      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          nodes: [{ id: 'submit-form', siegemasterSignoff: SignoffStub({ at: SERVER_INSTANT }) }],
          edges: [
            { id: 'submit-to-dashboard', siegemasterSignoff: SignoffStub({ at: SERVER_INSTANT }) },
          ],
          offMapSignoffs: [
            { id: 'concurrency', siegemasterSignoff: SignoffStub({ at: SERVER_INSTANT }) },
          ],
        },
      ]);
    });

    it('EDGE: {siegemasterSignoff: null, the walk-reset clear marker} => stays null so the merge still removes the key', () => {
      const result = questInputServerTimestampsTransformer({
        input: ModifyQuestInputStub({
          questId: 'add-auth',
          flows: [
            { id: 'login-flow', offMapSignoffs: [{ id: 'concurrency', siegemasterSignoff: null }] },
          ] as never,
        }),
        at: STAMPED_AT,
      });

      expect(result.flows).toStrictEqual([
        { id: 'login-flow', offMapSignoffs: [{ id: 'concurrency', siegemasterSignoff: null }] },
      ]);
    });

    it('EMPTY: {a flow patch carrying no sign-off anywhere} => comes back unchanged', () => {
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
