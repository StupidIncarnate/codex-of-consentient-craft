import { DuplicateInstallViolationStub } from '../../contracts/duplicate-install-violation/duplicate-install-violation.stub';
import { duplicateInstallViolationDisplayTransformer } from '../duplicate-install-violation-display/duplicate-install-violation-display-transformer';
import { duplicateInstallReportTransformer } from './duplicate-install-report-transformer';

describe('duplicateInstallReportTransformer', () => {
  describe('empty input', () => {
    it('EMPTY: {no violations} => returns the clean-run message', () => {
      const result = duplicateInstallReportTransformer({ violations: [] });

      expect(result).toBe(
        'duplicate-install: PASS — no gateway dependency resolves to more than one top-level ' +
          'node_modules copy.',
      );
    });
  });

  describe('valid inputs', () => {
    it('VALID: {one violation} => returns the FAIL header plus that violation block', () => {
      const violation = DuplicateInstallViolationStub();

      const result = duplicateInstallReportTransformer({ violations: [violation] });

      expect(result).toBe(
        `duplicate-install: FAIL — 1 package(s) with more than one install\n\n${duplicateInstallViolationDisplayTransformer({ violation })}`,
      );
    });

    it('VALID: {two violations} => joins both blocks with a blank line', () => {
      const first = DuplicateInstallViolationStub();
      const second = DuplicateInstallViolationStub({
        packageName: 'zod',
        locations: [
          { location: 'node_modules/zod', version: '3.25.76' },
          { location: 'packages/web/node_modules/zod', version: '3.24.0' },
        ],
      });

      const result = duplicateInstallReportTransformer({ violations: [first, second] });

      expect(result).toBe(
        `duplicate-install: FAIL — 2 package(s) with more than one install\n\n${duplicateInstallViolationDisplayTransformer({ violation: first })}\n\n${duplicateInstallViolationDisplayTransformer({ violation: second })}`,
      );
    });
  });
});
