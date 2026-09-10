import { passingTestsToTimingsTransformer } from './passing-tests-to-timings-transformer';
import { PassingTestStub } from '../../contracts/passing-test/passing-test.stub';

describe('passingTestsToTimingsTransformer', () => {
  describe('rolling tests up into suites', () => {
    it('VALID: {three tests in one spec} => one timing carrying their sum', () => {
      const passingTests = [
        PassingTestStub({ suitePath: 'src/a.e2e.ts', testName: 'one', durationMs: 400 }),
        PassingTestStub({ suitePath: 'src/a.e2e.ts', testName: 'two', durationMs: 600 }),
        PassingTestStub({ suitePath: 'src/a.e2e.ts', testName: 'three', durationMs: 250 }),
      ];

      const result = passingTestsToTimingsTransformer({ passingTests });

      expect(result).toStrictEqual([
        { filePath: 'src/a.e2e.ts', durationMs: 1250, testMs: 1250, rulesMs: 0 },
      ]);
    });

    it('VALID: {two specs} => one timing each, in first-seen order', () => {
      const passingTests = [
        PassingTestStub({ suitePath: 'src/b.e2e.ts', testName: 'one', durationMs: 100 }),
        PassingTestStub({ suitePath: 'src/a.e2e.ts', testName: 'two', durationMs: 900 }),
        PassingTestStub({ suitePath: 'src/b.e2e.ts', testName: 'three', durationMs: 50 }),
      ];

      const result = passingTestsToTimingsTransformer({ passingTests });

      expect(result).toStrictEqual([
        { filePath: 'src/b.e2e.ts', durationMs: 150, testMs: 150, rulesMs: 0 },
        { filePath: 'src/a.e2e.ts', durationMs: 900, testMs: 900, rulesMs: 0 },
      ]);
    });

    it('VALID: {one test} => wall and test time are the same number', () => {
      const passingTests = [
        PassingTestStub({ suitePath: 'src/a.e2e.ts', testName: 'one', durationMs: 700 }),
      ];

      const [timing] = passingTestsToTimingsTransformer({ passingTests });

      expect([timing?.durationMs, timing?.testMs]).toStrictEqual([700, 700]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {no tests} => returns no timings', () => {
      expect(passingTestsToTimingsTransformer({ passingTests: [] })).toStrictEqual([]);
    });

    it('EDGE: {every test reports zero} => one timing of zero', () => {
      const passingTests = [
        PassingTestStub({ suitePath: 'src/a.e2e.ts', testName: 'one', durationMs: 0 }),
        PassingTestStub({ suitePath: 'src/a.e2e.ts', testName: 'two', durationMs: 0 }),
      ];

      expect(passingTestsToTimingsTransformer({ passingTests })).toStrictEqual([
        { filePath: 'src/a.e2e.ts', durationMs: 0, testMs: 0, rulesMs: 0 },
      ]);
    });
  });
});
