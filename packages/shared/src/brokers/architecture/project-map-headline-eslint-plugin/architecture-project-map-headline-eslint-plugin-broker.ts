/**
 * PURPOSE: Renders the Rules registered, Config presets, and Detailed exemplar sections
 * for an eslint-plugin package in the project-map connection-graph view. Rules are grouped
 * by name prefix (ban-, enforce-, forbid-, require-, no-, other). Config presets are
 * extracted from the startup file. The exemplar picks the first rule and shows its file
 * path and PURPOSE comment.
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineEslintPluginBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/eslint-plugin'),
 * });
 * // Returns ContentText markdown with ## Rules registered, ## Config presets,
 * // and ## Detailed exemplar sections
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
import { eslintRuleNameFromPathTransformer } from '../../../transformers/eslint-rule-name-from-path/eslint-rule-name-from-path-transformer';
import { listRuleFilesLayerBroker } from './list-rule-files-layer-broker';
import { rulesSectionRenderLayerBroker } from './rules-section-render-layer-broker';
import { configPresetsSectionRenderLayerBroker } from './config-presets-section-render-layer-broker';
import { exemplarSectionRenderLayerBroker } from './exemplar-section-render-layer-broker';
import { readSourceLayerBroker } from './read-source-layer-broker';

export const architectureProjectMapHeadlineEslintPluginBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const ruleFiles = listRuleFilesLayerBroker({ packageRoot });
  const ruleNames = ruleFiles.map((filePath) => eslintRuleNameFromPathTransformer({ filePath }));

  const rulesSection = rulesSectionRenderLayerBroker({ ruleNames });

  // Find startup file for config preset extraction
  const startupSource = readSourceLayerBroker({
    filePath: absoluteFilePathContract.parse(
      `${String(packageRoot)}/src/startup/start-eslint-plugin.ts`,
    ),
  });

  const configSection = configPresetsSectionRenderLayerBroker({ startupSource });

  if (ruleFiles.length === 0) {
    return contentTextContract.parse(
      `${String(rulesSection)}\n\n---\n\n${String(configSection)}\n\n---`,
    );
  }

  const [firstRuleFile] = ruleFiles;
  if (firstRuleFile === undefined) {
    return contentTextContract.parse(
      `${String(rulesSection)}\n\n---\n\n${String(configSection)}\n\n---`,
    );
  }

  const firstRuleName = eslintRuleNameFromPathTransformer({ filePath: firstRuleFile });

  const exemplarSection = exemplarSectionRenderLayerBroker({
    ruleName: firstRuleName,
    ruleFilePath: firstRuleFile,
    packageRoot,
  });

  return contentTextContract.parse(
    `${String(rulesSection)}\n\n---\n\n${String(configSection)}\n\n---\n\n${String(exemplarSection)}`,
  );
};
