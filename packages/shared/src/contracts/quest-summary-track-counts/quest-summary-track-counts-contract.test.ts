import { signoffDenominatorTrackContract } from '../signoff-denominator-track/signoff-denominator-track-contract';
import { questSummaryTrackCountsContract } from './quest-summary-track-counts-contract';
import { QuestSummaryTrackCountsStub } from './quest-summary-track-counts.stub';

describe('questSummaryTrackCountsContract', () => {
  describe('valid counts', () => {
    it('VALID: {full counts} => parses the track id and all three numbers', () => {
      expect(QuestSummaryTrackCountsStub()).toStrictEqual({
        id: 'flowrider',
        confirmed: 12,
        unconfirmable: 1,
        outstanding: 3,
      });
    });

    it.each(signoffDenominatorTrackContract.options)(
      'VALID: {id: %s} => every denominator track is a legal id, groundstomper included',
      (track) => {
        expect(QuestSummaryTrackCountsStub({ id: track }).id).toBe(track);
      },
    );

    it('EMPTY: {id only} => defaults every count to zero', () => {
      expect(questSummaryTrackCountsContract.parse({ id: 'siegemaster' })).toStrictEqual({
        id: 'siegemaster',
        confirmed: 0,
        unconfirmable: 0,
        outstanding: 0,
      });
    });

    it('EDGE: {outstanding: 0} => a fully-signed track is representable', () => {
      expect(
        QuestSummaryTrackCountsStub({ confirmed: 16, unconfirmable: 0, outstanding: 0 }),
      ).toStrictEqual({
        id: 'flowrider',
        confirmed: 16,
        unconfirmable: 0,
        outstanding: 0,
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {id: "blightwarden"} => throws, blightwarden is not a verification track', () => {
      expect(() => QuestSummaryTrackCountsStub({ id: 'blightwarden' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {confirmed: -1} => throws', () => {
      expect(() => QuestSummaryTrackCountsStub({ confirmed: -1 as never })).toThrow(
        /greater than or equal to 0/u,
      );
    });

    it('INVALID: {outstanding: 1.5} => throws, a unit count is whole', () => {
      expect(() => QuestSummaryTrackCountsStub({ outstanding: 1.5 as never })).toThrow(
        /Expected integer/u,
      );
    });

    it('INVALID: {unconfirmable: "1"} => throws', () => {
      expect(() => QuestSummaryTrackCountsStub({ unconfirmable: '1' as never })).toThrow(
        /Expected number/u,
      );
    });
  });
});
