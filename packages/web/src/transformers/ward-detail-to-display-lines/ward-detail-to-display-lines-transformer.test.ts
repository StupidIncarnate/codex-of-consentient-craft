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

  describe('crash failures (no structured errors)', () => {
    it('VALID: {failing project with no errors/testFailures} => renders FAILED summary + rawOutput stdout', () => {
      const detail = WardDetailStub({
        checks: [
          {
            checkType: 'integration',
            status: 'fail',
            projectResults: [
              {
                projectFolder: { name: '@dungeonmaster/shared', path: '/repo/packages/shared' },
                status: 'fail',
                errors: [],
                testFailures: [],
                rawOutput: { stdout: 'Cannot find module ./missing', stderr: '', exitCode: 1 },
              },
            ],
          },
        ],
      });

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual([
        'integration: @dungeonmaster/shared — FAILED',
        'Cannot find module ./missing',
      ]);
    });

    it('VALID: {crash project with stderr only} => renders FAILED summary + stderr', () => {
      const detail = WardDetailStub({
        checks: [
          {
            checkType: 'integration',
            status: 'fail',
            projectResults: [
              {
                projectFolder: { name: 'shared', path: '/repo/packages/shared' },
                status: 'fail',
                errors: [],
                testFailures: [],
                rawOutput: { stdout: '', stderr: 'worker crashed', exitCode: 1 },
              },
            ],
          },
        ],
      });

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual(['integration: shared — FAILED', 'worker crashed']);
    });

    it('VALID: {crash project with no rawOutput} => renders FAILED summary only', () => {
      const detail = WardDetailStub({
        checks: [
          {
            checkType: 'integration',
            status: 'fail',
            projectResults: [
              {
                projectFolder: { name: 'shared', path: '/repo/packages/shared' },
                status: 'fail',
                errors: [],
                testFailures: [],
              },
            ],
          },
        ],
      });

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual(['integration: shared — FAILED']);
    });

    it('VALID: {passing project alongside a crash project} => renders only the crash', () => {
      const detail = WardDetailStub({
        checks: [
          {
            checkType: 'integration',
            status: 'fail',
            projectResults: [
              {
                projectFolder: {
                  name: '@dungeonmaster/orchestrator',
                  path: '/repo/packages/orchestrator',
                },
                status: 'pass',
                errors: [],
                testFailures: [],
              },
              {
                projectFolder: { name: '@dungeonmaster/shared', path: '/repo/packages/shared' },
                status: 'fail',
                errors: [],
                testFailures: [],
                rawOutput: { stdout: 'crash', stderr: '', exitCode: 1 },
              },
            ],
          },
        ],
      });

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual(['integration: @dungeonmaster/shared — FAILED', 'crash']);
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
