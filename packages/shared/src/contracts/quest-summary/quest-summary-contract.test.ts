import { QuestSummaryDebtStub } from '../quest-summary-debt/quest-summary-debt.stub';
import { QuestSummaryFlowStub } from '../quest-summary-flow/quest-summary-flow.stub';
import { QuestSummaryNoteGroupStub } from '../quest-summary-note-group/quest-summary-note-group.stub';
import { QuestSummaryObservableStub } from '../quest-summary-observable/quest-summary-observable.stub';
import { questSummaryContract } from './quest-summary-contract';
import { QuestSummaryStub } from './quest-summary.stub';

describe('questSummaryContract', () => {
  describe('valid summaries', () => {
    it('VALID: {full summary} => parses coverage, drift, debt and notes together', () => {
      expect(QuestSummaryStub()).toStrictEqual({
        questId: 'add-auth',
        flows: [QuestSummaryFlowStub()],
        midQuestObservables: [QuestSummaryObservableStub()],
        debt: [QuestSummaryDebtStub()],
        noteGroups: [QuestSummaryNoteGroupStub()],
      });
    });

    it('EMPTY: {questId only} => defaults every collection to empty', () => {
      expect(questSummaryContract.parse({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        flows: [],
        midQuestObservables: [],
        debt: [],
        noteGroups: [],
      });
    });

    it('VALID: {two flows} => keeps both in the order given', () => {
      expect(
        QuestSummaryStub({
          flows: [
            QuestSummaryFlowStub({ id: 'first-flow', name: 'First' }),
            QuestSummaryFlowStub({ id: 'second-flow', name: 'Second' }),
          ],
        }).flows,
      ).toStrictEqual([
        QuestSummaryFlowStub({ id: 'first-flow', name: 'First' }),
        QuestSummaryFlowStub({ id: 'second-flow', name: 'Second' }),
      ]);
    });

    it('EMPTY: {debt: []} => an empty debt list is the clean state', () => {
      expect(QuestSummaryStub({ debt: [] }).debt).toStrictEqual([]);
    });

    it('VALID: {debt carrying a cant-meet and an unmet} => keeps both marks in the one list', () => {
      expect(
        QuestSummaryStub({
          debt: [
            QuestSummaryDebtStub({
              id: 'login-flow:observable:cant:flowrider',
              unitId: 'login-flow:observable:cant',
              mark: 'cant-meet',
              toSettle: 'Add a webServer block to playwright.config.ts, then re-run this spec.',
            }),
            QuestSummaryDebtStub({
              id: 'login-flow:observable:still:flowrider',
              unitId: 'login-flow:observable:still',
              mark: 'unmet',
            }),
          ],
        }).debt.map((entry) => entry.mark),
      ).toStrictEqual(['cant-meet', 'unmet']);
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {questId: ""} => throws', () => {
      expect(() => QuestSummaryStub({ questId: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('EMPTY: {no questId} => throws, a summary names the quest it summarises', () => {
      expect(() => questSummaryContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {noteGroups: [{id: "blocker"}]} => throws', () => {
      expect(() =>
        questSummaryContract.parse({ questId: 'add-auth', noteGroups: [{ id: 'blocker' }] }),
      ).toThrow(/Invalid enum value/u);
    });

    it("INVALID: {unconfirmable: []} => throws, a retired field name is not silently dropped in `debt`'s favour", () => {
      expect(() => questSummaryContract.parse({ questId: 'add-auth', unconfirmable: [] })).toThrow(
        /Unrecognized key\(s\) in object: 'unconfirmable'/u,
      );
    });

    it('INVALID: {debt written as debts} => throws rather than defaulting `debt` to an empty list', () => {
      expect(() =>
        questSummaryContract.parse({
          questId: 'add-auth',
          debts: [QuestSummaryDebtStub()],
        }),
      ).toThrow(/Unrecognized key\(s\) in object: 'debts'/u);
    });
  });
});
