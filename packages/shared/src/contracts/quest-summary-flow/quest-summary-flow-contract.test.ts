import { QuestSummaryTrackCountsStub } from '../quest-summary-track-counts/quest-summary-track-counts.stub';
import { questSummaryFlowContract } from './quest-summary-flow-contract';
import { QuestSummaryFlowStub } from './quest-summary-flow.stub';

describe('questSummaryFlowContract', () => {
  describe('valid flows', () => {
    it('VALID: {runtime flow measured by both tracks} => parses identity and both rows', () => {
      expect(QuestSummaryFlowStub()).toStrictEqual({
        id: 'login-flow',
        name: 'Login Flow',
        flowType: 'runtime',
        tracks: [
          { id: 'flowrider', confirmed: 12, unconfirmable: 1, outstanding: 3 },
          { id: 'siegemaster', confirmed: 12, unconfirmable: 1, outstanding: 3 },
        ],
      });
    });

    it('VALID: {operational flow} => carries a siegemaster row alone', () => {
      expect(
        QuestSummaryFlowStub({
          id: 'lint-rule-registration' as never,
          name: 'Register the lint rule' as never,
          flowType: 'operational',
          tracks: [
            QuestSummaryTrackCountsStub({
              id: 'siegemaster',
              confirmed: 4,
              unconfirmable: 0,
              outstanding: 0,
            }),
          ],
        }),
      ).toStrictEqual({
        id: 'lint-rule-registration',
        name: 'Register the lint rule',
        flowType: 'operational',
        tracks: [{ id: 'siegemaster', confirmed: 4, unconfirmable: 0, outstanding: 0 }],
      });
    });

    it('EMPTY: {no tracks given} => defaults tracks to an empty list', () => {
      expect(
        questSummaryFlowContract.parse({ id: 'a-flow', name: 'A Flow', flowType: 'runtime' }),
      ).toStrictEqual({
        id: 'a-flow',
        name: 'A Flow',
        flowType: 'runtime',
        tracks: [],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {id: "Not Kebab"} => throws', () => {
      expect(() => QuestSummaryFlowStub({ id: 'Not Kebab' as never })).toThrow(/Invalid/u);
    });

    it('EMPTY: {name: ""} => throws', () => {
      expect(() => QuestSummaryFlowStub({ name: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {flowType: "batch"} => throws', () => {
      expect(() => QuestSummaryFlowStub({ flowType: 'batch' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {tracks: [{id: "blightwarden"}]} => throws', () => {
      expect(() => QuestSummaryFlowStub({ tracks: [{ id: 'blightwarden' } as never] })).toThrow(
        /Invalid enum value/u,
      );
    });
  });
});
