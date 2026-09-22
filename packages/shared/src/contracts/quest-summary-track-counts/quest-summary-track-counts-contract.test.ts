import { verificationTracksStatics } from '../../statics/verification-tracks/verification-tracks-statics';
import { questSummaryTrackCountsContract } from './quest-summary-track-counts-contract';
import { QuestSummaryTrackCountsStub } from './quest-summary-track-counts.stub';

const COUNT_FIELDS = Object.keys(questSummaryTrackCountsContract.shape).filter(
  (field) => field !== 'id',
);

describe('questSummaryTrackCountsContract', () => {
  describe('valid counts', () => {
    it('VALID: {full counts} => parses the track id and all four numbers', () => {
      expect(QuestSummaryTrackCountsStub()).toStrictEqual({
        id: 'flowrider',
        met: 12,
        cantMeet: 1,
        unmet: 2,
        outstanding: 3,
      });
    });

    it.each(verificationTracksStatics.roles)(
      'VALID: {id: %s} => every denominator track is a legal id',
      (track) => {
        expect(QuestSummaryTrackCountsStub({ id: track })).toStrictEqual({
          id: track,
          met: 12,
          cantMeet: 1,
          unmet: 2,
          outstanding: 3,
        });
      },
    );

    it('EMPTY: {id only} => defaults every one of the four counts to zero', () => {
      expect(questSummaryTrackCountsContract.parse({ id: 'siegemaster' })).toStrictEqual({
        id: 'siegemaster',
        met: 0,
        cantMeet: 0,
        unmet: 0,
        outstanding: 0,
      });
    });

    it('EDGE: {unmet: 4, outstanding: 0} => open work survives a track that has marked every unit', () => {
      expect(
        QuestSummaryTrackCountsStub({ met: 9, cantMeet: 1, unmet: 4, outstanding: 0 }),
      ).toStrictEqual({
        id: 'flowrider',
        met: 9,
        cantMeet: 1,
        unmet: 4,
        outstanding: 0,
      });
    });

    it('EDGE: {unmet: 0, outstanding: 4} => unlooked-at work survives a track with nothing left open', () => {
      expect(
        QuestSummaryTrackCountsStub({ met: 9, cantMeet: 1, unmet: 0, outstanding: 4 }),
      ).toStrictEqual({
        id: 'flowrider',
        met: 9,
        cantMeet: 1,
        unmet: 0,
        outstanding: 4,
      });
    });

    it('EDGE: {met: 16, rest 0} => a fully settled track is representable', () => {
      expect(
        QuestSummaryTrackCountsStub({ met: 16, cantMeet: 0, unmet: 0, outstanding: 0 }),
      ).toStrictEqual({
        id: 'flowrider',
        met: 16,
        cantMeet: 0,
        unmet: 0,
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

    it('EMPTY: {} => throws, the row cannot exist without the denominator track it counts over', () => {
      expect(() => questSummaryTrackCountsContract.parse({})).toThrow(/Required/u);
    });

    it.each(COUNT_FIELDS)(
      'INVALID: {%s: -1} => throws, a unit count is never negative',
      (field) => {
        expect(() => QuestSummaryTrackCountsStub({ [field]: -1 } as never)).toThrow(
          /greater than or equal to 0/u,
        );
      },
    );

    it.each(COUNT_FIELDS)('INVALID: {%s: 1.5} => throws, a unit count is whole', (field) => {
      expect(() => QuestSummaryTrackCountsStub({ [field]: 1.5 } as never)).toThrow(
        /Expected integer/u,
      );
    });

    it.each(COUNT_FIELDS)('INVALID: {%s: "1"} => throws, a unit count is a number', (field) => {
      expect(() => QuestSummaryTrackCountsStub({ [field]: '1' } as never)).toThrow(
        /Expected number/u,
      );
    });

    it('INVALID: {confirmed: 4} => throws, a retired count name never passes as a silent zeroed row', () => {
      expect(() =>
        questSummaryTrackCountsContract.parse({ id: 'flowrider', confirmed: 4 }),
      ).toThrow(/Unrecognized key\(s\) in object: 'confirmed'/u);
    });

    it('INVALID: {unconfirmable: 4} => throws, the retired name for cantMeet is refused rather than stripped', () => {
      expect(() =>
        questSummaryTrackCountsContract.parse({ id: 'flowrider', unconfirmable: 4 }),
      ).toThrow(/Unrecognized key\(s\) in object: 'unconfirmable'/u);
    });

    it('INVALID: {cantmeet: 4} => throws, a miscased count name never passes as a silent zero', () => {
      expect(() => questSummaryTrackCountsContract.parse({ id: 'flowrider', cantmeet: 4 })).toThrow(
        /Unrecognized key\(s\) in object: 'cantmeet'/u,
      );
    });
  });
});
