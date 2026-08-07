import { QuestSummaryFlowStub } from '../quest-summary-flow/quest-summary-flow.stub';
import { QuestSummaryNoteGroupStub } from '../quest-summary-note-group/quest-summary-note-group.stub';
import { QuestSummaryObservableStub } from '../quest-summary-observable/quest-summary-observable.stub';
import { QuestSummaryUnconfirmableStub } from '../quest-summary-unconfirmable/quest-summary-unconfirmable.stub';
import { questSummaryContract } from './quest-summary-contract';
import { QuestSummaryStub } from './quest-summary.stub';

describe('questSummaryContract', () => {
  describe('valid summaries', () => {
    it('VALID: {full summary} => parses coverage, drift, debt and notes together', () => {
      expect(QuestSummaryStub()).toStrictEqual({
        questId: 'add-auth',
        flows: [QuestSummaryFlowStub()],
        midQuestObservables: [QuestSummaryObservableStub()],
        unconfirmable: [QuestSummaryUnconfirmableStub()],
        noteGroups: [QuestSummaryNoteGroupStub()],
      });
    });

    it('EMPTY: {questId only} => defaults every collection to empty', () => {
      expect(questSummaryContract.parse({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        flows: [],
        midQuestObservables: [],
        unconfirmable: [],
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

    it('EMPTY: {no unconfirmable} => an empty debt list is the clean state', () => {
      expect(QuestSummaryStub({ unconfirmable: [] }).unconfirmable).toStrictEqual([]);
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
  });
});
