import { planningSurfaceReportContract } from './planning-surface-report-contract';
import { PlanningSurfaceReportStub } from './planning-surface-report.stub';

describe('planningSurfaceReportContract', () => {
  describe('valid reports', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const result = PlanningSurfaceReportStub();

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        sliceName: 'auth-slice',
        packages: ['@dungeonmaster/shared'],
        flowIds: [],
        observableIds: [],
        rawReport: '# Surface Scope Report\n\nDetails of the slice...',
        submittedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {submittedBy: "session-uuid"} => parses successfully', () => {
      const result = PlanningSurfaceReportStub({
        submittedBy: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        sliceName: 'auth-slice',
        packages: ['@dungeonmaster/shared'],
        flowIds: [],
        observableIds: [],
        rawReport: '# Surface Scope Report\n\nDetails of the slice...',
        submittedBy: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        submittedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {flowIds + observableIds populated} => parses successfully', () => {
      const result = PlanningSurfaceReportStub({
        flowIds: ['login-flow'],
        observableIds: ['user-sees-login'],
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        sliceName: 'auth-slice',
        packages: ['@dungeonmaster/shared'],
        flowIds: ['login-flow'],
        observableIds: ['user-sees-login'],
        rawReport: '# Surface Scope Report\n\nDetails of the slice...',
        submittedAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid reports', () => {
    it('INVALID: {id: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return planningSurfaceReportContract.parse({
          id: 'not-a-uuid',
          sliceName: 'x',
          packages: ['pkg'],
          rawReport: 'body',
          submittedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {packages: []} => throws validation error', () => {
      expect(() => {
        return planningSurfaceReportContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          sliceName: 'x',
          packages: [],
          rawReport: 'body',
          submittedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Array must contain at least 1 element/u);
    });

    it('INVALID: {sliceName: ""} => throws validation error', () => {
      expect(() => {
        return planningSurfaceReportContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          sliceName: '',
          packages: ['pkg'],
          rawReport: 'body',
          submittedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {rawReport: ""} => throws validation error', () => {
      expect(() => {
        return planningSurfaceReportContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          sliceName: 'x',
          packages: ['pkg'],
          rawReport: '',
          submittedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {submittedAt: "not-a-date"} => throws validation error', () => {
      expect(() => {
        return planningSurfaceReportContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          sliceName: 'x',
          packages: ['pkg'],
          rawReport: 'body',
          submittedAt: 'not-a-date',
        });
      }).toThrow(/Invalid datetime/u);
    });
  });
});
