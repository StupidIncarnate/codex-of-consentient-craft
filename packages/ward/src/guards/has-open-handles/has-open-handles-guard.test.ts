import { hasOpenHandlesGuard } from './has-open-handles-guard';
import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { OpenHandleStub } from '../../contracts/open-handle/open-handle.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { WardResultStub } from '../../contracts/ward-result/ward-result.stub';

describe('hasOpenHandlesGuard', () => {
  describe('runs that leaked', () => {
    it('VALID: {one handle in one package} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [ProjectResultStub({ openHandles: [OpenHandleStub()] })],
          }),
        ],
      });

      expect(hasOpenHandlesGuard({ wardResult })).toBe(true);
    });

    it('VALID: {handle only in the second package} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({ openHandles: [] }),
              ProjectResultStub({ openHandles: [OpenHandleStub({ name: 'setInterval' })] }),
            ],
          }),
        ],
      });

      expect(hasOpenHandlesGuard({ wardResult })).toBe(true);
    });

    it('VALID: {handle only in the second check} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({ checkType: 'unit', status: 'pass', projectResults: [] }),
          CheckResultStub({
            checkType: 'integration',
            status: 'pass',
            projectResults: [ProjectResultStub({ openHandles: [OpenHandleStub()] })],
          }),
        ],
      });

      expect(hasOpenHandlesGuard({ wardResult })).toBe(true);
    });
  });

  describe('runs that reported none', () => {
    it('VALID: {every package reported an empty array} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [ProjectResultStub({ openHandles: [] })],
          }),
        ],
      });

      expect(hasOpenHandlesGuard({ wardResult })).toBe(false);
    });

    it('EMPTY: {no checks} => returns false', () => {
      expect(hasOpenHandlesGuard({ wardResult: WardResultStub({ checks: [] }) })).toBe(false);
    });

    it('EMPTY: {wardResult: undefined} => returns false', () => {
      expect(hasOpenHandlesGuard({})).toBe(false);
    });
  });
});
