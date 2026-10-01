import { packageWardSettingsContract } from './package-ward-settings-contract';
import { PackageWardSettingsStub } from './package-ward-settings.stub';

describe('packageWardSettingsContract', () => {
  describe('valid settings', () => {
    it('VALID: {ward: {integrationBuild: true}} => parses it', () => {
      const settings = PackageWardSettingsStub();

      const result = packageWardSettingsContract.parse(settings);

      expect(result).toStrictEqual({ ward: { integrationBuild: true } });
    });

    it('VALID: {name, scripts, ward} => keeps every other package.json key', () => {
      const result = packageWardSettingsContract.parse({
        name: '@scope/cli',
        scripts: { build: 'tsc -p tsconfig.build.json' },
        ward: { integrationBuild: false },
      });

      expect(result).toStrictEqual({
        name: '@scope/cli',
        scripts: { build: 'tsc -p tsconfig.build.json' },
        ward: { integrationBuild: false },
      });
    });

    it('EMPTY: {} => parses with no ward key', () => {
      const result = packageWardSettingsContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('EMPTY: {ward: {}} => parses with an empty ward object', () => {
      const result = packageWardSettingsContract.parse({ ward: {} });

      expect(result).toStrictEqual({ ward: {} });
    });
  });

  describe('invalid settings', () => {
    it('INVALID: {ward: {integrationbuild: true}} => throws naming the misspelt key', () => {
      expect(() => packageWardSettingsContract.parse({ ward: { integrationbuild: true } })).toThrow(
        /"message": "Unrecognized key: \\"integrationbuild\\""/u,
      );
    });

    it('INVALID: {ward: {integrationBuild: "yes"}} => throws on a non-boolean value', () => {
      expect(() =>
        packageWardSettingsContract.parse({ ward: { integrationBuild: 'yes' } }),
      ).toThrow(/expected boolean, received string/u);
    });
  });
});
