import { trackCoverageContract } from './track-coverage-contract';
import { TrackCoverageStub } from './track-coverage.stub';

describe('trackCoverageContract', () => {
  describe('valid input', () => {
    it('VALID: {flowId: paste-image-into-composer, track: codeweaver, owed: 58, signed: 58, met: 55, cantMeet: 3, unsigned: 0} => returns the branded coverage', () => {
      const result = trackCoverageContract.parse({
        flowId: 'paste-image-into-composer',
        track: 'codeweaver',
        owed: 58,
        signed: 58,
        met: 55,
        cantMeet: 3,
        unsigned: 0,
      });

      expect(result).toStrictEqual(
        TrackCoverageStub({
          flowId: 'paste-image-into-composer',
          track: 'codeweaver',
          owed: 58,
          signed: 58,
          met: 55,
          cantMeet: 3,
          unsigned: 0,
        }),
      );
    });

    it('VALID: {flowId: send-message-with-images, track: siegemaster, owed: 71, signed: 67, met: 66, cantMeet: 1, unsigned: 4} => returns the branded coverage', () => {
      const result = trackCoverageContract.parse({
        flowId: 'send-message-with-images',
        track: 'siegemaster',
        owed: 71,
        signed: 67,
        met: 66,
        cantMeet: 1,
        unsigned: 4,
      });

      expect(result).toStrictEqual(
        TrackCoverageStub({
          flowId: 'send-message-with-images',
          track: 'siegemaster',
          owed: 71,
          signed: 67,
          met: 66,
          cantMeet: 1,
          unsigned: 4,
        }),
      );
    });
  });

  describe('track that never ran', () => {
    it('EDGE: {flowId: render-images-in-transcript, track: siegemaster, owed: 75, signed: 0, met: 0, cantMeet: 0, unsigned: 75} => returns the branded coverage', () => {
      const result = trackCoverageContract.parse({
        flowId: 'render-images-in-transcript',
        track: 'siegemaster',
        owed: 75,
        signed: 0,
        met: 0,
        cantMeet: 0,
        unsigned: 75,
      });

      expect(result).toStrictEqual(
        TrackCoverageStub({
          flowId: 'render-images-in-transcript',
          track: 'siegemaster',
          owed: 75,
          signed: 0,
          met: 0,
          cantMeet: 0,
          unsigned: 75,
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {signed: 58, unsigned: 1, owed: 58} => throws signed + unsigned mismatch', () => {
      expect(() =>
        TrackCoverageStub({
          owed: 58,
          signed: 58,
          met: 55,
          cantMeet: 3,
          unsigned: 1,
        }),
      ).toThrow(/signed \+ unsigned must equal owed/u);
    });

    it('INVALID: {met: 55, cantMeet: 2, signed: 58} => throws met + cantMeet mismatch', () => {
      expect(() =>
        TrackCoverageStub({
          owed: 58,
          signed: 58,
          met: 55,
          cantMeet: 2,
          unsigned: 0,
        }),
      ).toThrow(/met \+ cantMeet must equal signed/u);
    });

    it("INVALID: {track: 'ward'} => throws", () => {
      expect(() => TrackCoverageStub({ track: 'ward' as never })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {owed: -1} => throws', () => {
      expect(() => TrackCoverageStub({ owed: -1 as never })).toThrow(
        /greater than or equal to 0|Number must be/u,
      );
    });
  });
});
