import { grepHitsCapTransformer } from './grep-hits-cap-transformer';
import { GrepHitStub } from '../../contracts/grep-hit/grep-hit.stub';

describe('grepHitsCapTransformer', () => {
  describe('under every cap', () => {
    it('EMPTY: {hits: []} => no suffix and no lines', () => {
      const result = grepHitsCapTransformer({ hits: [], budgetRemaining: 8000 });

      expect(result).toStrictEqual({ labelSuffix: '', lines: [] });
    });

    it('VALID: {two scattered hits, budget available} => both lines verbatim, no marker', () => {
      const result = grepHitsCapTransformer({
        hits: [
          GrepHitStub({ line: 14, text: "if (error.code === 'ENOENT') {" }),
          GrepHitStub({ line: 18, text: 'throw new FileNotFoundError();' }),
        ],
        budgetRemaining: 8000,
      });

      expect(result).toStrictEqual({
        labelSuffix: '',
        lines: [":14  if (error.code === 'ENOENT') {", ':18  throw new FileNotFoundError();'],
      });
    });
  });

  describe('per-run cap', () => {
    it('VALID: {one run of 25 consecutive lines} => 20 lines then a marker naming the dropped range', () => {
      const hits = Array.from({ length: 25 }, (_unused, index) =>
        GrepHitStub({ line: index + 1, text: `line ${index + 1}` }),
      );

      const result = grepHitsCapTransformer({ hits, budgetRemaining: 8000 });

      expect(result).toStrictEqual({
        labelSuffix: '',
        lines: [
          ...Array.from({ length: 20 }, (_unused, index) => `:${index + 1}  line ${index + 1}`),
          '… 5 more lines (:21-:25)',
        ],
      });
    });

    it('EDGE: {one run of exactly 20 consecutive lines} => every line kept and no marker', () => {
      const hits = Array.from({ length: 20 }, (_unused, index) =>
        GrepHitStub({ line: index + 1, text: `line ${index + 1}` }),
      );

      const result = grepHitsCapTransformer({ hits, budgetRemaining: 8000 });

      expect(result).toStrictEqual({
        labelSuffix: '',
        lines: Array.from({ length: 20 }, (_unused, index) => `:${index + 1}  line ${index + 1}`),
      });
    });

    it('VALID: {a 5-line run then a 25-line run} => only the long run is capped, with its OWN range', () => {
      const shortRun = Array.from({ length: 5 }, (_unused, index) =>
        GrepHitStub({ line: index + 1, text: `a${index + 1}` }),
      );
      const longRun = Array.from({ length: 25 }, (_unused, index) =>
        GrepHitStub({ line: index + 101, text: `b${index + 101}` }),
      );

      const result = grepHitsCapTransformer({
        hits: [...shortRun, ...longRun],
        budgetRemaining: 8000,
      });

      expect(result).toStrictEqual({
        labelSuffix: '',
        lines: [
          ...Array.from({ length: 5 }, (_unused, index) => `:${index + 1}  a${index + 1}`),
          ...Array.from({ length: 20 }, (_unused, index) => `:${index + 101}  b${index + 101}`),
          '… 5 more lines (:121-:125)',
        ],
      });
    });
  });

  describe('per-file cap', () => {
    it('VALID: {51 scattered hits} => 40 lines then a count of the rest', () => {
      const hits = Array.from({ length: 51 }, (_unused, index) =>
        GrepHitStub({ line: index * 2 + 1, text: `hit ${index}` }),
      );

      const result = grepHitsCapTransformer({ hits, budgetRemaining: 8000 });

      expect(result).toStrictEqual({
        labelSuffix: '',
        lines: [
          ...Array.from({ length: 40 }, (_unused, index) => `:${index * 2 + 1}  hit ${index}`),
          '… 11 more matching lines in this file',
        ],
      });
    });

    it('VALID: {a 25-line run followed by 30 scattered hits} => the file count excludes the run marker', () => {
      const run = Array.from({ length: 25 }, (_unused, index) =>
        GrepHitStub({ line: index + 1, text: `run ${index + 1}` }),
      );
      const scattered = Array.from({ length: 30 }, (_unused, index) =>
        GrepHitStub({ line: index * 2 + 101, text: `scattered ${index}` }),
      );

      const result = grepHitsCapTransformer({
        hits: [...run, ...scattered],
        budgetRemaining: 8000,
      });

      // The 40 kept lines hold one run marker, so 39 of the 55 hits are shown and 16 are not.
      expect(result).toStrictEqual({
        labelSuffix: '',
        lines: [
          ...Array.from({ length: 20 }, (_unused, index) => `:${index + 1}  run ${index + 1}`),
          '… 5 more lines (:21-:25)',
          ...Array.from(
            { length: 19 },
            (_unused, index) => `:${index * 2 + 101}  scattered ${index}`,
          ),
          '… 16 more matching lines in this file',
        ],
      });
    });
  });

  describe('budget exhausted', () => {
    it('EDGE: {budgetRemaining: 0, three hits} => the count moves to the label and no lines print', () => {
      const result = grepHitsCapTransformer({
        hits: [
          GrepHitStub({ line: 1, text: 'a' }),
          GrepHitStub({ line: 5, text: 'b' }),
          GrepHitStub({ line: 9, text: 'c' }),
        ],
        budgetRemaining: 0,
      });

      expect(result).toStrictEqual({ labelSuffix: '  — 3 matching lines', lines: [] });
    });

    it('EDGE: {budgetRemaining: -500, one hit} => still names the file with its count', () => {
      const result = grepHitsCapTransformer({
        hits: [GrepHitStub({ line: 1, text: 'a' })],
        budgetRemaining: -500,
      });

      expect(result).toStrictEqual({ labelSuffix: '  — 1 matching lines', lines: [] });
    });

    it('EDGE: {budgetRemaining: 0, hits: []} => no suffix, because there is nothing to report', () => {
      const result = grepHitsCapTransformer({ hits: [], budgetRemaining: 0 });

      expect(result).toStrictEqual({ labelSuffix: '', lines: [] });
    });
  });
});
