/**
 * PURPOSE: Renders the Config presets section for an eslint-plugin package.
 * Extracts preset names from the startup source and renders them as a list.
 *
 * USAGE:
 * const section = configPresetsSectionRenderLayerBroker({
 *   startupSource: contentTextContract.parse('... configs: { dungeonmaster: ... } ...'),
 * });
 * // Returns ContentText with ## Config presets header + preset list
 *
 * WHEN-TO-USE: eslint-plugin headline broker rendering the config presets section
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapHeadlineEslintPluginStatics } from '../../../statics/project-map-headline-eslint-plugin/project-map-headline-eslint-plugin-statics';
import { eslintConfigPresetsExtractTransformer } from '../../../transformers/eslint-config-presets-extract/eslint-config-presets-extract-transformer';

export const configPresetsSectionRenderLayerBroker = ({
  startupSource,
}: {
  startupSource: ContentText | undefined;
}): ContentText => {
  if (startupSource === undefined) {
    return contentTextContract.parse(
      `${projectMapHeadlineEslintPluginStatics.configSectionHeader}\n\n${projectMapHeadlineEslintPluginStatics.configSectionEmpty}`,
    );
  }

  const presets = eslintConfigPresetsExtractTransformer({ source: startupSource });

  if (presets.length === 0) {
    return contentTextContract.parse(
      `${projectMapHeadlineEslintPluginStatics.configSectionHeader}\n\n${projectMapHeadlineEslintPluginStatics.configSectionEmpty}`,
    );
  }

  const lines: ContentText[] = [
    contentTextContract.parse(projectMapHeadlineEslintPluginStatics.configSectionHeader),
    contentTextContract.parse(''),
  ];

  for (const preset of presets) {
    lines.push(contentTextContract.parse(`- ${String(preset)}`));
  }

  return contentTextContract.parse(lines.map(String).join('\n'));
};
