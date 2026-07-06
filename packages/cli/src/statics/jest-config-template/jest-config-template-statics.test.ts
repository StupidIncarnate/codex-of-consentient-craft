import { jestConfigTemplateStatics } from './jest-config-template-statics';

describe('jestConfigTemplateStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(jestConfigTemplateStatics).toStrictEqual({
      content: `const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  roots: ['<rootDir>/src'],
};
`,
    });
  });
});
