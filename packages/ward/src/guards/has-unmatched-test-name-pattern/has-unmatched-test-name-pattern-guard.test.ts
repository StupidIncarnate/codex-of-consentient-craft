import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { WardResultStub } from '../../contracts/ward-result/ward-result.stub';
import { hasUnmatchedTestNamePatternGuard } from './has-unmatched-test-name-pattern-guard';

describe('hasUnmatchedTestNamePatternGuard', () => {
  describe('pattern matched somewhere', () => {
    it('VALID: {one package matched, rest unmatched} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({ status: 'pass', testNamePatternMatch: 'matched' }),
              ProjectResultStub({ status: 'skip', testNamePatternMatch: 'unmatched' }),
              ProjectResultStub({ status: 'skip', testNamePatternMatch: 'unmatched' }),
            ],
          }),
        ],
      });

      expect(hasUnmatchedTestNamePatternGuard({ wardResult })).toBe(false);
    });

    it('VALID: {unit unmatched but integration matched} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'skip',
            projectResults: [
              ProjectResultStub({ status: 'skip', testNamePatternMatch: 'unmatched' }),
            ],
          }),
          CheckResultStub({
            checkType: 'integration',
            status: 'pass',
            projectResults: [
              ProjectResultStub({ status: 'pass', testNamePatternMatch: 'matched' }),
            ],
          }),
        ],
      });

      expect(hasUnmatchedTestNamePatternGuard({ wardResult })).toBe(false);
    });
  });

  describe('pattern matched nowhere', () => {
    it('VALID: {every package unmatched} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'skip',
            projectResults: [
              ProjectResultStub({ status: 'skip', testNamePatternMatch: 'unmatched' }),
              ProjectResultStub({ status: 'skip', testNamePatternMatch: 'unmatched' }),
            ],
          }),
        ],
      });

      expect(hasUnmatchedTestNamePatternGuard({ wardResult })).toBe(true);
    });

    it('VALID: {unmatched unit alongside a passing lint} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass' })],
          }),
          CheckResultStub({
            checkType: 'unit',
            status: 'skip',
            projectResults: [
              ProjectResultStub({ status: 'skip', testNamePatternMatch: 'unmatched' }),
            ],
          }),
        ],
      });

      expect(hasUnmatchedTestNamePatternGuard({ wardResult })).toBe(true);
    });
  });

  describe('pattern never applied', () => {
    it('VALID: {no project carries a pattern outcome} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass' })],
          }),
        ],
      });

      expect(hasUnmatchedTestNamePatternGuard({ wardResult })).toBe(false);
    });

    it('EMPTY: {no checks} => returns false', () => {
      expect(hasUnmatchedTestNamePatternGuard({ wardResult: WardResultStub() })).toBe(false);
    });
  });

  describe('missing inputs', () => {
    it('EMPTY: {wardResult undefined} => returns false', () => {
      expect(hasUnmatchedTestNamePatternGuard({})).toBe(false);
    });
  });
});
