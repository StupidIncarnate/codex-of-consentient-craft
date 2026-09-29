import { ScanViolationStub } from '../../contracts/scan-violation/scan-violation.stub';
import { scanViolationsToBatchesTransformer } from './scan-violations-to-batches-transformer';

const filesOf = ({
  batches,
}: {
  batches: ReturnType<typeof scanViolationsToBatchesTransformer>;
}): ReturnType<typeof ScanViolationStub>['file'][][] =>
  batches.map((batch) => [...new Set(batch.map((violation) => violation.file))]);

const violationsForFiles = ({ count }: { count: number }): ReturnType<typeof ScanViolationStub>[] =>
  Array.from({ length: count }, (_unused, index) =>
    ScanViolationStub({ file: `src/f${String(index).padStart(2, '0')}.ts` }),
  );

describe('scanViolationsToBatchesTransformer', () => {
  describe('batch sizing', () => {
    it('EMPTY: {no violations} => returns no batches', () => {
      const result = scanViolationsToBatchesTransformer({ violations: [] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {one file with hits} => returns one batch of that file', () => {
      const result = scanViolationsToBatchesTransformer({
        violations: violationsForFiles({ count: 1 }),
      });

      expect(filesOf({ batches: result })).toStrictEqual([['src/f00.ts']]);
    });

    it.each([
      { count: 2, sizes: [2] },
      { count: 4, sizes: [4] },
      { count: 5, sizes: [3, 2] },
      { count: 8, sizes: [4, 4] },
      { count: 9, sizes: [3, 3, 3] },
      { count: 13, sizes: [4, 3, 3, 3] },
      { count: 17, sizes: [4, 4, 3, 3, 3] },
    ])('VALID: {$count files} => batches of $sizes files', ({ count, sizes }) => {
      const result = scanViolationsToBatchesTransformer({
        violations: violationsForFiles({ count }),
      });

      expect(filesOf({ batches: result }).map((files) => files.length)).toStrictEqual(sizes);
    });
  });

  describe('file grouping', () => {
    it('VALID: {two files, several hits each, interleaved} => each file lands whole in one batch, in first-seen order', () => {
      const first = ScanViolationStub({ file: 'src/a.ts', line: 1, message: 'one' });
      const second = ScanViolationStub({ file: 'src/b.ts', line: 5, message: 'two' });
      const third = ScanViolationStub({ file: 'src/a.ts', line: 9, message: 'three' });

      const result = scanViolationsToBatchesTransformer({ violations: [first, second, third] });

      expect(result).toStrictEqual([
        [
          { file: 'src/a.ts', line: 1, message: 'one' },
          { file: 'src/a.ts', line: 9, message: 'three' },
          { file: 'src/b.ts', line: 5, message: 'two' },
        ],
      ]);
    });
  });
});
