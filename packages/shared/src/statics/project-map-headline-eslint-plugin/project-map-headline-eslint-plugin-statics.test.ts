import { projectMapHeadlineEslintPluginStatics } from './project-map-headline-eslint-plugin-statics';

describe('projectMapHeadlineEslintPluginStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapHeadlineEslintPluginStatics).toStrictEqual({
      rulesSectionHeader: '## Rules registered',
      rulesSectionEmpty: '(no rules found in this package)',
      configSectionHeader: '## Config presets',
      configSectionEmpty: '(no config presets found)',
      exemplarSectionPrefix: '## Detailed exemplar — `',
      exemplarSectionSuffix: '`',
      knownPrefixes: ['ban', 'enforce', 'forbid', 'require', 'no'],
      prefixLabelWidth: 9,
      ruleNameParentDirDepth: 2,
    });
  });
});
