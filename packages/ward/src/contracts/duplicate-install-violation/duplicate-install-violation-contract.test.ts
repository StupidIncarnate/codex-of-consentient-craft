import { duplicateInstallViolationContract } from './duplicate-install-violation-contract';
import { DuplicateInstallViolationStub } from './duplicate-install-violation.stub';

describe('duplicateInstallViolationContract', () => {
  describe('valid inputs', () => {
    it('VALID: {packageName, two locations} => parses successfully', () => {
      const violation = DuplicateInstallViolationStub();

      const result = duplicateInstallViolationContract.parse(violation);

      expect(result).toStrictEqual({
        packageName: '@mantine/core',
        locations: [
          { location: 'packages/@gateway/npm/node_modules/@mantine/core', version: '8.3.18' },
          { location: 'packages/web/node_modules/@mantine/core', version: '8.3.14' },
        ],
      });
    });

    it('VALID: {packageName, three locations} => parses successfully', () => {
      const violation = DuplicateInstallViolationStub({
        locations: [
          { location: 'node_modules/zod', version: '3.25.76' },
          { location: 'packages/@gateway/npm/node_modules/zod', version: '3.25.76' },
          { location: 'packages/web/node_modules/zod', version: '3.24.0' },
        ],
      });

      const result = duplicateInstallViolationContract.parse(violation);

      expect(result.locations).toStrictEqual([
        { location: 'node_modules/zod', version: '3.25.76' },
        { location: 'packages/@gateway/npm/node_modules/zod', version: '3.25.76' },
        { location: 'packages/web/node_modules/zod', version: '3.24.0' },
      ]);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {locations: single entry} => throws', () => {
      expect(() =>
        duplicateInstallViolationContract.parse({
          packageName: '@mantine/core',
          locations: [{ location: 'packages/web/node_modules/@mantine/core', version: '8.3.14' }],
        }),
      ).toThrow(/Array must contain at least 2 element/u);
    });

    it('INVALID: {locations: empty array} => throws', () => {
      expect(() =>
        duplicateInstallViolationContract.parse({ packageName: '@mantine/core', locations: [] }),
      ).toThrow(/Array must contain at least 2 element/u);
    });

    it('INVALID: {missing packageName} => throws', () => {
      expect(() =>
        duplicateInstallViolationContract.parse({
          locations: [
            { location: 'a/node_modules/x', version: '1.0.0' },
            { location: 'b/node_modules/x', version: '1.0.1' },
          ],
        }),
      ).toThrow(/received undefined/u);
    });
  });
});
