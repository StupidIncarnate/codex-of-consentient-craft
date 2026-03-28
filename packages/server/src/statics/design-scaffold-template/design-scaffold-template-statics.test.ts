import { designScaffoldTemplateStatics } from './design-scaffold-template-statics';

describe('designScaffoldTemplateStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(Object.keys(designScaffoldTemplateStatics.files)).toStrictEqual([
      'packageJson',
      'viteConfig',
      'indexHtml',
      'mainJsx',
    ]);
    expect(designScaffoldTemplateStatics.files.packageJson.length).toBeGreaterThan(50);
    expect(designScaffoldTemplateStatics.files.viteConfig.length).toBeGreaterThan(50);
    expect(designScaffoldTemplateStatics.files.indexHtml.length).toBeGreaterThan(50);
    expect(designScaffoldTemplateStatics.files.mainJsx.length).toBeGreaterThan(50);
  });
});
