import { projectMapHeadlineEslintPluginStatics } from './project-map-headline-eslint-plugin-statics';

describe('projectMapHeadlineEslintPluginStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapHeadlineEslintPluginStatics).toStrictEqual({
      configSectionHeader: '## Config presets',
      configSectionEmpty: '(no config presets found)',
      exemplarSectionPrefix: '## Detailed exemplar — `',
      exemplarSectionSuffix: '`',
      ruleNameParentDirDepth: 2,
    });
  });
});
