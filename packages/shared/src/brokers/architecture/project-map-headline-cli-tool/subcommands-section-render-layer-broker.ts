/**
 * PURPOSE: Renders the Subcommands table section for a cli-tool package. Extracts
 * subcommand literals from startup source via transformers, pairs them with responder
 * names, and falls back to the bin command name for single-command packages.
 *
 * USAGE:
 * const section = subcommandsSectionRenderLayerBroker({
 *   startupSource: contentTextContract.parse('if (args[0] === "run") ...'),
 *   binName: contentTextContract.parse('dungeonmaster-ward'),
 * });
 * // Returns ContentText markdown with ## Subcommands table
 *
 * WHEN-TO-USE: cli-tool headline broker building the Subcommands section
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapHeadlineCliToolStatics } from '../../../statics/project-map-headline-cli-tool/project-map-headline-cli-tool-statics';
import { cliSubcommandLiteralsExtractTransformer } from '../../../transformers/cli-subcommand-literals-extract/cli-subcommand-literals-extract-transformer';
import { cliResponderImportsExtractTransformer } from '../../../transformers/cli-responder-imports-extract/cli-responder-imports-extract-transformer';

export const subcommandsSectionRenderLayerBroker = ({
  startupSource,
  binName,
}: {
  startupSource: ContentText | undefined;
  binName: ContentText;
}): ContentText => {
  const { subcommandsSectionHeader, commandNamePadWidth } = projectMapHeadlineCliToolStatics;

  const parts = [subcommandsSectionHeader, '', '```'];

  if (startupSource === undefined) {
    const cmdName = String(binName).split('/').at(-1) ?? String(binName);
    parts.push(`${cmdName.padEnd(commandNamePadWidth)} → (single-command bin)`);
    parts.push('```');
    return contentTextContract.parse(parts.join('\n'));
  }

  const subcommands = cliSubcommandLiteralsExtractTransformer({ source: startupSource });
  const responders = cliResponderImportsExtractTransformer({ source: startupSource });

  if (subcommands.length === 0) {
    const cmdName = String(binName).split('/').at(-1) ?? String(binName);
    const [firstResponder] = responders;
    const target = firstResponder === undefined ? '(single-command bin)' : String(firstResponder);
    parts.push(`${cmdName.padEnd(commandNamePadWidth)} → ${target}`);
  } else {
    const [lastResponder] = [...responders].reverse();
    subcommands.forEach((cmd, index) => {
      const responderAtIndex = responders[index];
      const target =
        responderAtIndex === undefined
          ? lastResponder === undefined
            ? '(responder)'
            : String(lastResponder)
          : String(responderAtIndex);
      parts.push(`${String(cmd).padEnd(commandNamePadWidth)} → ${target}`);
    });
  }

  parts.push('```');
  return contentTextContract.parse(parts.join('\n'));
};
