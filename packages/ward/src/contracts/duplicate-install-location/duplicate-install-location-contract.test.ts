import { duplicateInstallLocationContract } from './duplicate-install-location-contract';
import { DuplicateInstallLocationStub } from './duplicate-install-location.stub';

describe('duplicateInstallLocationContract', () => {
  describe('valid inputs', () => {
    it('VALID: {location, version} => parses successfully', () => {
      const location = DuplicateInstallLocationStub({
        location: 'packages/web/node_modules/@mantine/core',
        version: '8.3.14',
      });

      const result = duplicateInstallLocationContract.parse(location);

      expect(result).toStrictEqual({
        location: 'packages/web/node_modules/@mantine/core',
        version: '8.3.14',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {location: ""} => throws', () => {
      expect(() =>
        duplicateInstallLocationContract.parse({ location: '', version: '8.3.18' }),
      ).toThrow(/expected string to have >=1 characters/u);
    });

    it('INVALID: {version: ""} => throws', () => {
      expect(() =>
        duplicateInstallLocationContract.parse({ location: 'packages/web', version: '' }),
      ).toThrow(/expected string to have >=1 characters/u);
    });

    it('INVALID: {missing location} => throws', () => {
      expect(() => duplicateInstallLocationContract.parse({ version: '8.3.18' })).toThrow(
        /received undefined/u,
      );
    });
  });
});
