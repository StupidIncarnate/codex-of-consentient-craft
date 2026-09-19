import { pruneStatics } from './prune-statics';

describe('pruneStatics', () => {
  describe('window', () => {
    it("VALID: {window} => holds the spec's two age-out windows, video shorter than the default", () => {
      expect(pruneStatics.window).toStrictEqual({
        defaultOlderThan: '7d',
        videoOlderThan: '2d',
      });
    });
  });

  describe('olderThan', () => {
    it('VALID: {unitNames} => every unit, longest first', () => {
      expect(pruneStatics.olderThan.unitNames).toStrictEqual(['d', 'h', 'm', 's']);
    });

    it('VALID: {unitMs} => each unit in milliseconds', () => {
      expect(pruneStatics.olderThan.unitMs).toStrictEqual({
        s: 1000,
        m: 60_000,
        h: 3_600_000,
        d: 86_400_000,
      });
    });

    it('VALID: {unitNames} => names exactly the keys unitMs holds, so a refusal can never list a unit the parser rejects', () => {
      expect([...pruneStatics.olderThan.unitNames].sort()).toStrictEqual(
        Object.keys(pruneStatics.olderThan.unitMs).sort(),
      );
    });
  });

  describe('assets', () => {
    it('VALID: {videoExtension} => the one evidence extension evidenceFileStatics does not hold', () => {
      expect(pruneStatics.assets.videoExtension).toBe('.webm');
    });
  });

  describe('size', () => {
    it("VALID: {bytesPerMegabyte} => a mebibyte, matching machineReadBroker's own readings", () => {
      expect(pruneStatics.size.bytesPerMegabyte).toBe(1_048_576);
    });
  });
});
