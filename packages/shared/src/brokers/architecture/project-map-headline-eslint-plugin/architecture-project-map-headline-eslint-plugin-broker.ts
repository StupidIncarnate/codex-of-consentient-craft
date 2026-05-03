/**
 * PURPOSE: Renders the Config presets section for an eslint-plugin package in the
 * project-map connection-graph view. Config presets are extracted from the startup file.
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineEslintPluginBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/eslint-plugin'),
 * });
 * // Returns ContentText markdown with ## Config presets section
 *
 * WHEN-TO-USE: As the headline renderer for packages detected as eslint-plugin type
 * WHEN-NOT-TO-USE: For non-eslint-plugin packages
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { configPresetsSectionRenderLayerBroker } from './config-presets-section-render-layer-broker';
import { readSourceLayerBroker } from './read-source-layer-broker';

export const architectureProjectMapHeadlineEslintPluginBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const startupSource = readSourceLayerBroker({
    filePath: absoluteFilePathContract.parse(
      `${String(packageRoot)}/src/startup/start-eslint-plugin.ts`,
    ),
  });

  const configSection = configPresetsSectionRenderLayerBroker({ startupSource });

  return contentTextContract.parse(`${String(configSection)}\n\n---`);
};
