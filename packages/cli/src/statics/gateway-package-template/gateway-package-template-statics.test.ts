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

  it('VALID: {} => the jest config content spreads the repo-root base three levels up', () => {
    expect(gatewayPackageTemplateStatics.jestConfigContent).toBe(
      `// Extend shared Jest configuration
const baseConfig = require('../../../jest.config.base.js');

module.exports = {
  ...baseConfig,
};
`,
    );
  });
});
