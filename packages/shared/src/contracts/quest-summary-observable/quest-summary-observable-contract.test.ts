import { observableOriginContract } from '../observable-origin/observable-origin-contract';
import { questSummaryObservableContract } from './quest-summary-observable-contract';
import { QuestSummaryObservableStub } from './quest-summary-observable.stub';

const MID_QUEST_ORIGINS = observableOriginContract.options.filter((origin) => origin !== 'spec');

describe('questSummaryObservableContract', () => {
  describe('valid observables', () => {
    it('VALID: {siegemaster-added observable} => parses provenance, anchor and verbatim text', () => {
      expect(QuestSummaryObservableStub()).toStrictEqual({
        id: 'login-flow:observable:rejects-bleh-payload',
        flowId: 'login-flow',
        nodeId: 'submit-credentials',
        observableId: 'rejects-bleh-payload',
        addedBy: 'siegemaster',
        observableType: 'api-call',
        description: 'POST /api/auth/login returns 400 for a non-JSON body',
      });
    });

    it.each(MID_QUEST_ORIGINS)(
      'VALID: {addedBy: %s} => every non-spec origin is a legal mid-quest author',
      (origin) => {
        expect(QuestSummaryObservableStub({ addedBy: origin }).addedBy).toBe(origin);
      },
    );

    it('EMPTY: {description: ""} => a blank observable is carried, not dropped', () => {
      expect(QuestSummaryObservableStub({ description: '' as never }).description).toBe('');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {id: "not-three-segments"} => throws, the id is the derived unit id', () => {
      expect(() => QuestSummaryObservableStub({ id: 'not-three-segments' as never })).toThrow(
        /Invalid/u,
      );
    });

    it('INVALID: {addedBy: "blightwarden"} => throws', () => {
      expect(() => QuestSummaryObservableStub({ addedBy: 'blightwarden' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {observableType: "vibes"} => throws', () => {
      expect(() => QuestSummaryObservableStub({ observableType: 'vibes' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {nodeId: "Submit Credentials"} => throws', () => {
      expect(() => QuestSummaryObservableStub({ nodeId: 'Submit Credentials' as never })).toThrow(
        /Invalid/u,
      );
    });

    it('EMPTY: {no fields} => throws, every anchor is required', () => {
      expect(() => questSummaryObservableContract.parse({})).toThrow(/Required/u);
    });
  });
});
