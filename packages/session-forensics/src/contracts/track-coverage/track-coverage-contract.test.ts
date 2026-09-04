import { trackCoverageContract } from './track-coverage-contract';
import { TrackCoverageStub } from './track-coverage.stub';

describe('trackCoverageContract', () => {
  describe('valid input', () => {
    it('VALID: {flowId: paste-image-into-composer, track: codeweaverSignoff, owed: 58, signed: 58, confirmed: 55, unconfirmable: 3, unsigned: 0} => returns the branded coverage', () => {
      const result = trackCoverageContract.parse({
        flowId: 'paste-image-into-composer',
        track: 'codeweaverSignoff',
        owed: 58,
        signed: 58,
        confirmed: 55,
        unconfirmable: 3,
        unsigned: 0,
      });

      expect(result).toStrictEqual(
        TrackCoverageStub({
          flowId: 'paste-image-into-composer',
          track: 'codeweaverSignoff',
          owed: 58,
          signed: 58,
          confirmed: 55,
          unconfirmable: 3,
          unsigned: 0,
        }),
      );
    });

    it('VALID: {flowId: send-message-with-images, track: siegemasterSignoff, owed: 71, signed: 67, confirmed: 66, unconfirmable: 1, unsigned: 4} => returns the branded coverage', () => {
      const result = trackCoverageContract.parse({
        flowId: 'send-message-with-images',
        track: 'siegemasterSignoff',
        owed: 71,
        signed: 67,
        confirmed: 66,
        unconfirmable: 1,
        unsigned: 4,
      });

      expect(result).toStrictEqual(
        TrackCoverageStub({
          flowId: 'send-message-with-images',
          track: 'siegemasterSignoff',
          owed: 71,
          signed: 67,
          confirmed: 66,
          unconfirmable: 1,
          unsigned: 4,
        }),
      );
    });
  });

  describe('track that never ran', () => {
    it('EDGE: {flowId: render-images-in-transcript, track: siegemasterSignoff, owed: 75, signed: 0, confirmed: 0, unconfirmable: 0, unsigned: 75} => returns the branded coverage', () => {
      const result = trackCoverageContract.parse({
        flowId: 'render-images-in-transcript',
        track: 'siegemasterSignoff',
        owed: 75,
        signed: 0,
        confirmed: 0,
        unconfirmable: 0,
        unsigned: 75,
      });

      expect(result).toStrictEqual(
        TrackCoverageStub({
          flowId: 'render-images-in-transcript',
          track: 'siegemasterSignoff',
          owed: 75,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
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
          confirmed: 55,
          unconfirmable: 3,
          unsigned: 1,
        }),
      ).toThrow(/signed \+ unsigned must equal owed/u);
    });

    it('INVALID: {confirmed: 55, unconfirmable: 2, signed: 58} => throws confirmed + unconfirmable mismatch', () => {
      expect(() =>
        TrackCoverageStub({
          owed: 58,
          signed: 58,
          confirmed: 55,
          unconfirmable: 2,
          unsigned: 0,
        }),
      ).toThrow(/confirmed \+ unconfirmable must equal signed/u);
    });

    it("INVALID: {track: 'wardSignoff'} => throws", () => {
      expect(() => TrackCoverageStub({ track: 'wardSignoff' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {owed: -1} => throws', () => {
      expect(() => TrackCoverageStub({ owed: -1 as never })).toThrow(
        /greater than or equal to 0|Number must be/u,
      );
    });
  });
});
