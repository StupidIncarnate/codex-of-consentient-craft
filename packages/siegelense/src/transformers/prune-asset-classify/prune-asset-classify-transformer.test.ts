import { pruneAssetClassifyTransformer } from './prune-asset-classify-transformer';

describe('pruneAssetClassifyTransformer', () => {
  describe('recognised assets', () => {
    it('VALID: {fileName: "step1.png"} => returns shot', () => {
      expect(pruneAssetClassifyTransformer({ fileName: 'step1.png' })).toBe('shot');
    });

    it('VALID: {fileName: "walk.webm"} => returns video', () => {
      expect(pruneAssetClassifyTransformer({ fileName: 'walk.webm' })).toBe('video');
    });

    it('VALID: {fileName: "run_2.jsonl"} => returns run — a run transcript is classified as run alongside stored readings and capture buffers', () => {
      expect(pruneAssetClassifyTransformer({ fileName: 'run_2.jsonl' })).toBe('run');
    });

    it('VALID: {fileName: "run_2.json"} => the stored return pairs with it under the same kind, so a kind selector never splits a run in half', () => {
      expect(pruneAssetClassifyTransformer({ fileName: 'run_2.json' })).toBe('run');
    });
  });

  describe('unrecognised files', () => {
    it('VALID: {fileName: "notes.txt"} => returns null rather than guessing a class', () => {
      expect(pruneAssetClassifyTransformer({ fileName: 'notes.txt' })).toBe(null);
    });

    it('EDGE: {fileName: "png"} => a bare extension word with no dot is not a shot', () => {
      expect(pruneAssetClassifyTransformer({ fileName: 'png' })).toBe(null);
    });

    it('EDGE: {fileName: "step1.PNG"} => an uppercase extension is not matched, because nothing this package writes produces one', () => {
      expect(pruneAssetClassifyTransformer({ fileName: 'step1.PNG' })).toBe(null);
    });
  });
});
