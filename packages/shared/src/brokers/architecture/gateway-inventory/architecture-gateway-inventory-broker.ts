/**
 * PURPOSE: Renders the gateway (`#gateway`) as one grouped section — `npm`/`node`/`browser`/`bin`,
 * each with every real subpath it holds, the real module or global each one passes through (read
 * from that subpath's own barrel file, never guessed from its folder name), and the wrapper names
 * we add on top, with a banned or restricted one marked per `gatewayLintConfigReadBroker`'s config.
 * Both `get-project-map({ packages: ['#gateway'] })` and `get-project-inventory({ packageName:
 * '#gateway' })` call this and prepend their own header line — this broker owns only the grouped
 * body, since the header format differs per tool (`#` for the map, `##` for the inventory listing).
 * A folder with no subpaths yet (a consumer's un-filled `@gateway/npm` or `@gateway/bin`, which
 * `init` scaffolds with only a placeholder `src/index.d.ts`) renders as "(empty)" rather than being
 * skipped, so a caller sees all four groups exist even before a first wrapper is added to one.
 *
 * USAGE:
 * architectureGatewayInventoryBroker({ projectRoot: absoluteFilePathContract.parse('/repo') });
 * // Returns ContentText: "### bin\n  (empty)\n\n### browser\n...\n\n### node\n  #gateway/node/fs  passes through 'fs'\n      ours: existsSync, ...\n\n### npm\n..."
 */

import { existsSync, readFileSync, readdirEntriesSync } from '#gateway/node/fs';
import type { DirEntrySync } from '#gateway/node/fs';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { gatewayLocationsStatics } from '../../../statics/gateway-locations/gateway-locations-statics';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import { gatewaySubpathBarrelParseTransformer } from '../../../transformers/gateway-subpath-barrel-parse/gateway-subpath-barrel-parse-transformer';
import { gatewayWrapperAnnotateTransformer } from '../../../transformers/gateway-wrapper-annotate/gateway-wrapper-annotate-transformer';
import { gatewayLintConfigReadBroker } from '../../gateway-lint-config/read/gateway-lint-config-read-broker';

// Mirrors the literal group folder gatewayLocationsStatics.packageGlobs itself builds
// (`packages/@gateway/<folder>/src/**`) — every gateway package lives under this ONE group folder.
const GATEWAY_GROUP_DIR_NAME = '@gateway';
const EMPTY_GROUP_LABEL = '  (empty)';
const OURS_LINE_INDENT = '      ';
const SUBPATH_LINE_INDENT = '  ';

export const architectureGatewayInventoryBroker = ({
  projectRoot,
}: {
  projectRoot: string;
}): ContentText => {
  const gatewayLintConfig = gatewayLintConfigReadBroker({ repoRoot: projectRoot });

  const groupSections = Object.values(gatewayLocationsStatics.folders).map((folder) => {
    const folderSrcPath = `${projectRoot}/${projectMapStatics.packagesDirName}/${GATEWAY_GROUP_DIR_NAME}/${folder}/${projectMapStatics.srcDirName}`;

    let subpathEntries: DirEntrySync[] = [];
    try {
      subpathEntries = readdirEntriesSync(folderSrcPath);
    } catch {
      // No subpaths scaffolded yet under this gateway folder — rendered as "(empty)" below.
    }

    const subpathNames = subpathEntries
      .filter((entry) => entry.kind === 'directory')
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    if (subpathNames.length === 0) {
      return contentTextContract.parse(`### ${folder}\n${EMPTY_GROUP_LABEL}`);
    }

    const subpathLines = subpathNames.flatMap((subpathName) => {
      const fullSubpath = `${gatewayLocationsStatics.importPrefix}/${folder}/${subpathName}`;
      const barrelPath = `${folderSrcPath}/${subpathName}/${subpathName}.ts`;
      const bareSubpathLine = `${SUBPATH_LINE_INDENT}${fullSubpath}`;

      if (!existsSync(barrelPath)) {
        return [bareSubpathLine];
      }

      // A barrel that exists but cannot be read renders the same as one that never existed.
      try {
        const barrelContent = contentTextContract.parse(readFileSync(barrelPath));
        const { realModule, wrapperNames } = gatewaySubpathBarrelParseTransformer({
          barrelContent,
        });

        const headline =
          realModule === undefined
            ? bareSubpathLine
            : `${bareSubpathLine}  passes through '${realModule}'`;

        if (wrapperNames.length === 0) {
          return [headline];
        }

        const annotated = gatewayWrapperAnnotateTransformer({
          subpath: contentTextContract.parse(fullSubpath),
          wrapperNames,
          gatewayLintConfig,
        });

        return [headline, `${OURS_LINE_INDENT}ours: ${annotated.join(', ')}`];
      } catch {
        return [bareSubpathLine];
      }
    });

    return contentTextContract.parse([`### ${folder}`, ...subpathLines].join('\n'));
  });

  return contentTextContract.parse(groupSections.join('\n\n'));
};
