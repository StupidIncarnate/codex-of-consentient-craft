import { WardDetailStub } from '../../contracts/ward-detail/ward-detail.stub';

import { wardDetailToDisplayLinesTransformer } from './ward-detail-to-display-lines-transformer';

describe('wardDetailToDisplayLinesTransformer', () => {
  describe('lint/typecheck errors', () => {
    it('VALID: {one lint error with line and rule} => one labelled line', () => {
      const detail = WardDetailStub();

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual([
        'lint: packages/web/src/index.ts:10 — Unexpected any [@typescript-eslint/no-explicit-any]',
      ]);
    });
  });

  describe('test failures', () => {
    it('VALID: {one unit test failure} => one labelled line', () => {
      const detail = WardDetailStub({
        checks: [
          {
            checkType: 'unit',
            projectResults: [
              {
                testFailures: [
                  {
                    suitePath: 'src/foo.test.ts',
                    testName: 'does a thing',
                    message: 'expected true',
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual(['unit: src/foo.test.ts › does a thing — expected true']);
    });
  });

  describe('mixed and multiple checks', () => {
    it('VALID: {errors across two checks} => preserves check order', () => {
      const detail = WardDetailStub({
        checks: [
          {
            checkType: 'typecheck',
            projectResults: [{ errors: [{ filePath: 'a.ts', message: 'TS2339' }] }],
          },
          {
            checkType: 'unit',
            projectResults: [{ testFailures: [{ suitePath: 'b.test.ts', message: 'boom' }] }],
          },
        ],
      });

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual(['typecheck: a.ts — TS2339', 'unit: b.test.ts — boom']);
    });
  });

  describe('no failures', () => {
    it('EMPTY: {checks empty} => returns empty array', () => {
      const detail = WardDetailStub({ checks: [] });

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {unparseable detail} => returns empty array', () => {
      const result = wardDetailToDisplayLinesTransformer({ detail: 'not-an-object' });

      expect(result).toStrictEqual([]);
    });
  });
});
