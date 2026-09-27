import { gatewayPackageTemplateStatics } from './gateway-package-template-statics';

describe('gatewayPackageTemplateStatics', () => {
  it('VALID: {} => extends the repo root config three levels up', () => {
    expect(gatewayPackageTemplateStatics.tsconfigExtends).toBe('../../../tsconfig.json');
  });

  it('VALID: {} => carries the same devDependency pins the real gateway packages ship', () => {
    expect(gatewayPackageTemplateStatics.devDependencies).toStrictEqual({
      '@types/node': '^24.0.15',
      typescript: '^5.8.3',
    });
  });

  it('VALID: {} => the jest config content spreads the published @dungeonmaster/testing base', () => {
    expect(gatewayPackageTemplateStatics.jestConfigContent).toBe(
      `const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
};
`,
    );
  });

  it('VALID: {} => the root tsconfig resolves node16 with the source condition', () => {
    expect(gatewayPackageTemplateStatics.rootCompilerOptions).toStrictEqual({
      module: 'node16',
      moduleResolution: 'node16',
      customConditions: ['source'],
    });
  });

  it('VALID: {} => a build reads other gateways through gateway-dist before source', () => {
    expect(gatewayPackageTemplateStatics.buildCustomConditions).toStrictEqual([
      'gateway-dist',
      'source',
    ]);
  });
});
