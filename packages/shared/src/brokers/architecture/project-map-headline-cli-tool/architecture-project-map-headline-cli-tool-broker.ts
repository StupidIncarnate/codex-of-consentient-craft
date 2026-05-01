/**
 * PURPOSE: Renders the Subcommands table and Detailed exemplar sections for a cli-tool
 * package in the project-map connection-graph view. Subcommands are extracted from the
 * startup file via regex detection of args[0] === '<cmd>' and case '<cmd>': patterns.
 * The exemplar traces the first subcommand end-to-end.
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineCliToolBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/ward'),
 * });
 * // Returns ContentText markdown with ## Subcommands and ## Detailed exemplar sections
 *
 * WHEN-TO-USE: As the headline renderer for packages detected as cli-tool type
 * WHEN-NOT-TO-USE: For non-cli-tool packages
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { cliSubcommandLiteralsExtractTransformer } from '../../../transformers/cli-subcommand-literals-extract/cli-subcommand-literals-extract-transformer';
import { readPackageJsonLayerBroker } from './read-package-json-layer-broker';
import { readStartupFileLayerBroker } from './read-startup-file-layer-broker';
import { subcommandsSectionRenderLayerBroker } from './subcommands-section-render-layer-broker';
import { exemplarSectionRenderLayerBroker } from './exemplar-section-render-layer-broker';

export const architectureProjectMapHeadlineCliToolBroker = ({
  projectRoot: _projectRoot,
  packageRoot,
}: {
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const pkgJson = readPackageJsonLayerBroker({ packageRoot });
  const binName = (() => {
    if (pkgJson?.bin === undefined) {
      return contentTextContract.parse('(unknown-bin)');
    }
    if (typeof pkgJson.bin === 'string') {
      return contentTextContract.parse(String(pkgJson.bin));
    }
    const [firstKey] = Object.keys(pkgJson.bin);
    return contentTextContract.parse(firstKey ?? '(unknown-bin)');
  })();

  const startupSource = readStartupFileLayerBroker({ packageRoot });

  const subcommandsSection = subcommandsSectionRenderLayerBroker({
    startupSource,
    binName,
  });

  if (startupSource === undefined) {
    return contentTextContract.parse(`${String(subcommandsSection)}\n\n---`);
  }

  const subcommands = cliSubcommandLiteralsExtractTransformer({ source: startupSource });
  const [firstSubcommand] = subcommands;

  if (firstSubcommand === undefined) {
    return contentTextContract.parse(`${String(subcommandsSection)}\n\n---`);
  }

  const exemplarSection = exemplarSectionRenderLayerBroker({
    subcommand: firstSubcommand,
    startupSource,
    packageRoot,
  });

  return contentTextContract.parse(
    `${String(subcommandsSection)}\n\n---\n\n${String(exemplarSection)}`,
  );
};
