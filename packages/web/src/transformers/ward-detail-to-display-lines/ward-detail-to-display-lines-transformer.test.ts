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

  describe('discovery mismatch (no structured failures)', () => {
    it('VALID: {check flagged discoveryMismatch with counts + onlyDiscovered} => renders mismatch header + discovered file lines', () => {
      const detail = WardDetailStub({
        checks: [
          {
            checkType: 'e2e',
            status: 'skip',
            discoveryMismatch: true,
            projectResults: [
              {
                projectFolder: { name: '@dungeonmaster/web', path: '/repo/packages/web' },
                status: 'skip',
                errors: [],
                testFailures: [],
                filesCount: 0,
                discoveredCount: 2,
                onlyDiscovered: [
                  'packages/web/src/flows/home/quest-delete-from-root.e2e.ts',
                  'packages/web/src/flows/home/other.e2e.ts',
                ],
                onlyProcessed: [],
              },
            ],
          },
        ],
      });

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual([
        'e2e: DISCOVERY MISMATCH — 2 discovered, 0 processed',
        'e2e: only discovered — packages/web/src/flows/home/quest-delete-from-root.e2e.ts',
        'e2e: only discovered — packages/web/src/flows/home/other.e2e.ts',
      ]);
    });

    it('VALID: {check flagged discoveryMismatch with counts only, no file lists} => renders mismatch header from counts', () => {
      const detail = WardDetailStub({
        checks: [
          {
            checkType: 'e2e',
            status: 'skip',
            discoveryMismatch: true,
            projectResults: [
              {
                projectFolder: { name: '@dungeonmaster/web', path: '/repo/packages/web' },
                status: 'skip',
                errors: [],
                testFailures: [],
                filesCount: 0,
                discoveredCount: 46,
              },
            ],
          },
        ],
      });

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual(['e2e: DISCOVERY MISMATCH — 46 discovered, 0 processed']);
    });

    it('VALID: {onlyProcessed present (discovered but unrun the other way)} => renders processed file lines too', () => {
      const detail = WardDetailStub({
        checks: [
          {
            checkType: 'unit',
            status: 'pass',
            discoveryMismatch: true,
            projectResults: [
              {
                projectFolder: { name: '@dungeonmaster/web', path: '/repo/packages/web' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
                discoveredCount: 0,
                onlyDiscovered: [],
                onlyProcessed: ['packages/web/src/orphan.test.ts'],
              },
            ],
          },
        ],
      });

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual([
        'unit: DISCOVERY MISMATCH — 0 discovered, 1 processed',
        'unit: only processed — packages/web/src/orphan.test.ts',
      ]);
    });

    it('EMPTY: {skip check WITHOUT discoveryMismatch flag} => returns empty array (web never recomputes the verdict)', () => {
      const detail = WardDetailStub({
        checks: [
          {
            checkType: 'e2e',
            status: 'skip',
            projectResults: [
              {
                projectFolder: { name: '@dungeonmaster/web', path: '/repo/packages/web' },
                status: 'skip',
                errors: [],
                testFailures: [],
                filesCount: 0,
                discoveredCount: 46,
              },
            ],
          },
        ],
      });

      const result = wardDetailToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual([]);
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
