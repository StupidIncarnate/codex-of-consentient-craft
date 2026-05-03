/**
 * PURPOSE: Configuration constants for the eslint-plugin headline renderer
 *
 * USAGE:
 * projectMapHeadlineEslintPluginStatics.configSectionHeader; // '## Config presets'
 * projectMapHeadlineEslintPluginStatics.ruleNameParentDirDepth; // 2
 *
 * WHEN-TO-USE: project-map-headline-eslint-plugin broker and its layer brokers
 */

export const projectMapHeadlineEslintPluginStatics = {
  configSectionHeader: '## Config presets',
  configSectionEmpty: '(no config presets found)',
  ruleNameParentDirDepth: 2,
} as const;
