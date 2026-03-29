import { designScaffoldTemplateStatics } from './design-scaffold-template-statics';

describe('designScaffoldTemplateStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(designScaffoldTemplateStatics).toStrictEqual({
      files: {
        packageJson: expect.any(String),
        viteConfig: expect.any(String),
        indexHtml: expect.any(String),
        mainJsx: expect.any(String),
      },
    });
  });
});
