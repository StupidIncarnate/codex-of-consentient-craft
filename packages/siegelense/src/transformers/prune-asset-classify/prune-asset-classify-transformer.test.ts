import { FileNameStub } from '@dungeonmaster/shared/contracts';

import { pruneAssetClassifyTransformer } from './prune-asset-classify-transformer';

describe('pruneAssetClassifyTransformer', () => {
  describe('recognised assets', () => {
    it('VALID: {fileName: "step1.png"} => returns shot', () => {
      expect(
        pruneAssetClassifyTransformer({ fileName: FileNameStub({ value: 'step1.png' }) }),
      ).toBe('shot');
    });

    it('VALID: {fileName: "walk.webm"} => returns video', () => {
      expect(
        pruneAssetClassifyTransformer({ fileName: FileNameStub({ value: 'walk.webm' }) }),
      ).toBe('video');
    });

    it('VALID: {fileName: "run_2.jsonl"} => returns transcript', () => {
      expect(
        pruneAssetClassifyTransformer({ fileName: FileNameStub({ value: 'run_2.jsonl' }) }),
      ).toBe('transcript');
    });

    it('VALID: {fileName: "run_2.json"} => the stored return is a transcript too, so a kind selector never splits a run in half', () => {
      expect(
        pruneAssetClassifyTransformer({ fileName: FileNameStub({ value: 'run_2.json' }) }),
      ).toBe('transcript');
    });
  });

  describe('unrecognised files', () => {
    it('VALID: {fileName: "notes.txt"} => returns null rather than guessing a class', () => {
      expect(
        pruneAssetClassifyTransformer({ fileName: FileNameStub({ value: 'notes.txt' }) }),
      ).toBe(null);
    });

    it('EDGE: {fileName: "png"} => a bare extension word with no dot is not a shot', () => {
      expect(pruneAssetClassifyTransformer({ fileName: FileNameStub({ value: 'png' }) })).toBe(
        null,
      );
    });

    it('EDGE: {fileName: "step1.PNG"} => an uppercase extension is not matched, because nothing this package writes produces one', () => {
      expect(
        pruneAssetClassifyTransformer({ fileName: FileNameStub({ value: 'step1.PNG' }) }),
      ).toBe(null);
    });
  });
});
