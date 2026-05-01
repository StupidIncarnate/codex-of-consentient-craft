/**
 * PURPOSE: Renders the Detailed exemplar section for one ESLint rule, showing the
 * rule's file path and PURPOSE description extracted from its source comment.
 *
 * USAGE:
 * const section = exemplarSectionRenderLayerBroker({
 *   ruleName: contentTextContract.parse('ban-primitives'),
 *   ruleFilePath: absoluteFilePathContract.parse('/repo/packages/eslint-plugin/src/brokers/rule/ban-primitives/rule-ban-primitives-broker.ts'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/eslint-plugin'),
 * });
 * // Returns ContentText with ## Detailed exemplar header, file path, and PURPOSE line
 *
 * WHEN-TO-USE: eslint-plugin headline broker rendering one rule as an exemplar
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { projectMapHeadlineEslintPluginStatics } from '../../../statics/project-map-headline-eslint-plugin/project-map-headline-eslint-plugin-statics';
import { rulePurposeExtractTransformer } from '../../../transformers/rule-purpose-extract/rule-purpose-extract-transformer';
import { readSourceLayerBroker } from './read-source-layer-broker';

export const exemplarSectionRenderLayerBroker = ({
  ruleName,
  ruleFilePath,
  packageRoot,
}: {
  ruleName: ContentText;
  ruleFilePath: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const header = `${projectMapHeadlineEslintPluginStatics.exemplarSectionPrefix}${String(ruleName)}${projectMapHeadlineEslintPluginStatics.exemplarSectionSuffix}`;

  const packageRootStr = String(packageRoot);
  const filePathStr = String(ruleFilePath);
  const relativePath = filePathStr.startsWith(`${packageRootStr}/`)
    ? filePathStr.slice(packageRootStr.length + 1)
    : filePathStr;

  const source = readSourceLayerBroker({ filePath: ruleFilePath });
  const purpose = source === undefined ? undefined : rulePurposeExtractTransformer({ source });

  const lines: ContentText[] = [
    contentTextContract.parse(header),
    contentTextContract.parse(''),
    contentTextContract.parse(`File: \`${relativePath}\``),
  ];

  if (purpose !== undefined) {
    lines.push(contentTextContract.parse(''));
    lines.push(contentTextContract.parse(`PURPOSE: ${String(purpose)}`));
  }

  return contentTextContract.parse(lines.map(String).join('\n'));
};
