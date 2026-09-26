import { DuplicateInstallViolationStub } from '../../contracts/duplicate-install-violation/duplicate-install-violation.stub';
import { duplicateInstallViolationDisplayTransformer } from './duplicate-install-violation-display-transformer';

describe('duplicateInstallViolationDisplayTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {two locations} => renders the header, both locations, then the fix line', () => {
      const violation = DuplicateInstallViolationStub();

      const result = duplicateInstallViolationDisplayTransformer({ violation });

      expect(result).toBe(
        '@mantine/core installed at 2 locations:\n' +
          '  packages/@gateway/npm/node_modules/@mantine/core (8.3.18)\n' +
          '  packages/web/node_modules/@mantine/core (8.3.14)\n' +
          'Run `npm dedupe`, then align version ranges if a duplicate remains.',
      );
    });

    it('VALID: {three locations} => renders every location on its own line', () => {
      const violation = DuplicateInstallViolationStub({
        packageName: 'zod',
        locations: [
          { location: 'node_modules/zod', version: '3.25.76' },
          { location: 'packages/@gateway/npm/node_modules/zod', version: '3.25.76' },
          { location: 'packages/web/node_modules/zod', version: '3.24.0' },
        ],
      });

      const result = duplicateInstallViolationDisplayTransformer({ violation });

      expect(result).toBe(
        'zod installed at 3 locations:\n' +
          '  node_modules/zod (3.25.76)\n' +
          '  packages/@gateway/npm/node_modules/zod (3.25.76)\n' +
          '  packages/web/node_modules/zod (3.24.0)\n' +
          'Run `npm dedupe`, then align version ranges if a duplicate remains.',
      );
    });
  });
});
