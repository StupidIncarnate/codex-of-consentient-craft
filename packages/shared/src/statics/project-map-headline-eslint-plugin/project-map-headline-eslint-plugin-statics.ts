/**
 * PURPOSE: Configuration constants for the eslint-plugin headline renderer
 *
 * USAGE:
 * projectMapHeadlineEslintPluginStatics.rulesSectionHeader; // '## Rules registered'
 * projectMapHeadlineEslintPluginStatics.knownPrefixes; // ['ban', 'enforce', ...]
 *
 * WHEN-TO-USE: project-map-headline-eslint-plugin broker and its layer brokers
 */

export const projectMapHeadlineEslintPluginStatics = {
  rulesSectionHeader: '## Rules registered',
  rulesSectionEmpty: '(no rules found in this package)',
  configSectionHeader: '## Config presets',
  configSectionEmpty: '(no config presets found)',
  exemplarSectionPrefix: '## Detailed exemplar — `',
  exemplarSectionSuffix: '`',
  knownPrefixes: ['ban', 'enforce', 'forbid', 'require', 'no'] as const,
  prefixLabelWidth: 9,
  ruleNameParentDirDepth: 2,
} as const;
