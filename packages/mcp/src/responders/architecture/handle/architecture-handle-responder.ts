/**
 * PURPOSE: Handles architecture-related MCP tool calls (discover, get-architecture, get-folder-detail, get-testing-patterns, get-project-map, get-project-inventory)
 *
 * USAGE:
 * const result = await ArchitectureHandleResponder({ tool: ToolNameStub({ value: 'get-architecture' }), args: {}, meta: undefined });
 * // Returns CallToolResult with architecture content
 *
 * discover, get-project-map and get-project-inventory resolve their project root via
 * ResolveCallerRepoRootLayerResponder — the caller's cwd the dungeonmaster-pre-mcp-caller hook
 * stamps on the call — instead of the server's own processCwdAdapter(): the MCP stdio child is one
 * per top-level session (shared by every Task sub-agent it dispatches), so its own cwd never
 * reflects a sub-agent pinned to a worktree. get-project-map and get-project-inventory (plain-text responses)
 * prefix callerRepoRootBannerTransformer's banner naming which root the answer describes and
 * whether a `.dungeonmaster.json` was actually found there; discover's response is parsed as JSON
 * by callers, so it carries the same facts as `projectRoot`/`projectRootSource`/`configFound`
 * fields instead of prose — a banner PREFIX would have broken `JSON.parse` outright, which is
 * exactly what the mcp-server-flow integration suite caught. Either way, a fallback to the
 * server's own cwd, or a resolved cwd with no confirmed dungeonmaster config above it, is now
 * VISIBLE, not a repeat of the silent "worktree comes back empty" bug this exists to fix.
 *
 * get-project-inventory's `packageName` is looked up first as `packages/<packageName>` directly;
 * only when that folder is absent does it scan `packages/@*` group folders for a child of that
 * name, so a gateway package resolves by its own bare name (`npm`, not `@gateway/npm`) the same as
 * every other package, and an ordinary package never pays the extra readdir.
 */

import {
  architectureOverviewBroker,
  architecturePackageInventoryBroker,
  architectureProjectMapBroker,
  architectureGatewayInventoryBroker,
} from '@dungeonmaster/shared/brokers';
import { pathSegmentContract, contentTextContract as sharedContentTextContract } from '@dungeonmaster/shared/contracts';
import { existsSync, readdirEntriesSync } from '#gateway/node/fs';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
// sharedContentTextContract is used to brand the packageName string for the inventory broker call
import { architectureFolderDetailBroker } from '../../../brokers/architecture/folder-detail/architecture-folder-detail-broker';
import { architectureTestingPatternsBroker } from '../../../brokers/architecture/testing-patterns/architecture-testing-patterns-broker';
import { mcpDiscoverBroker } from '../../../brokers/mcp/discover/mcp-discover-broker';
import { callerRepoRootBannerTransformer } from '../../../transformers/caller-repo-root-banner/caller-repo-root-banner-transformer';
import { discoverIgnoreState } from '../../../state/discover-ignore/discover-ignore-state';
import { folderConstraintsState } from '../../../state/folder-constraints/folder-constraints-state';
import type { CallToolResult } from '#gateway/npm/modelcontextprotocol__sdk__types';
import type { ToolName } from '../../../contracts/tool-name/tool-name-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { folderDetailInputContract } from '../../../contracts/folder-detail-input/folder-detail-input-contract';
import { getProjectInventoryInputContract } from '../../../contracts/get-project-inventory-input/get-project-inventory-input-contract';
import { getProjectMapInputContract } from '../../../contracts/get-project-map-input/get-project-map-input-contract';
import { ResolveCallerRepoRootLayerResponder } from './resolve-caller-repo-root-layer-responder';

const JSON_INDENT_SPACES = 2;

// A directory directly under `packages/` whose name starts with `@` is a scope/group folder, not
// a package itself — the same nesting `node_modules/@scope/name` uses. The gateway packages moved
// under `packages/@gateway/` but kept their bare, unique lookup name (`npm`, not `@gateway/npm`).
const GROUP_FOLDER_PREFIX = '@';

export const ArchitectureHandleResponder = async ({
  tool,
  args,
  meta,
}: {
  tool: ToolName;
  args: Record<string, unknown>;
  // An explicit `| undefined` union rather than an optional key: under exactOptionalPropertyTypes
  // the caller can then forward its own possibly-absent `meta` as `{ meta }` directly, instead of
  // guarding the property into existence with a conditional spread at the call site.
  meta: Record<string, unknown> | undefined;
}): Promise<CallToolResult> => {
  if (tool === 'discover') {
    const { repoRoot, source, configFound } = await ResolveCallerRepoRootLayerResponder({ meta });
    const result = await mcpDiscoverBroker({
      input: args as never,
      ignorePatterns: discoverIgnoreState.get(),
      rootPath: pathSegmentContract.parse(String(repoRoot)),
    });
    // discover's response is JSON a caller parses, so the resolved root travels as fields
    // alongside `results`/`count` rather than as prose — see the file header for why.
    const resultWithRoot = {
      ...result,
      projectRoot: String(repoRoot),
      projectRootSource: source,
      configFound,
    };

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(JSON.stringify(resultWithRoot, null, JSON_INDENT_SPACES)),
        },
      ],
    };
  }

  if (tool === 'get-architecture') {
    const result = architectureOverviewBroker();

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(result),
        },
      ],
    };
  }

  if (tool === 'get-folder-detail') {
    const { folderType } = folderDetailInputContract.parse(args);
    const supplementalConstraints = folderConstraintsState.get({ folderType });

    const result = architectureFolderDetailBroker({
      folderType,
      ...(supplementalConstraints && { supplementalConstraints }),
    });

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(result),
        },
      ],
    };
  }

  if (tool === 'get-testing-patterns') {
    const result = architectureTestingPatternsBroker();

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(result),
        },
      ],
    };
  }

  if (tool === 'get-project-map') {
    const { packages } = getProjectMapInputContract.parse(args);
    const { repoRoot, source, configFound } = await ResolveCallerRepoRootLayerResponder({ meta });
    const banner = callerRepoRootBannerTransformer({ repoRoot, source, configFound });
    const result = await architectureProjectMapBroker({
      projectRoot: String(repoRoot),
      packages,
    });

    return {
      content: [{ type: 'text', text: contentTextContract.parse(`${banner}\n\n${result}`) }],
    };
  }

  if (tool === 'get-project-inventory') {
    const { packageName } = getProjectInventoryInputContract.parse(args);
    const { repoRoot, source, configFound } = await ResolveCallerRepoRootLayerResponder({ meta });
    const banner = callerRepoRootBannerTransformer({ repoRoot, source, configFound });

    // '#gateway' is never a real directory under packages/ — it names all four real gateway
    // packages (npm, node, browser, bin) grouped as one, so it is answered here before the
    // direct/group-folder lookup below, which resolves each of THEM by their own bare name.
    if (String(packageName) === gatewayLocationsStatics.importPrefix) {
      const gatewayResult = architectureGatewayInventoryBroker({
        projectRoot: String(repoRoot),
      });

      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              `${banner}\n\n## ${String(packageName)} — outside packages, Node, the browser and installed programs, reached only through here\n\n${gatewayResult}`,
            ),
          },
        ],
      };
    }

    const packagesPath = `${repoRoot}/packages`;
    const directPackageDir = `${packagesPath}/${packageName}`;

    // Prefer the direct folder when it exists; only scan group folders for a matching child when
    // it does not, so an ordinary (non-gateway) package never pays this extra readdir.
    const groupChildMatch = existsSync(directPackageDir)
      ? undefined
      : readdirEntriesSync(packagesPath)
          .filter(
            (entry) => entry.kind === 'directory' && entry.name.startsWith(GROUP_FOLDER_PREFIX),
          )
          .flatMap((group) => {
            const groupPath = `${packagesPath}/${group.name}`;
            return readdirEntriesSync(groupPath)
              .filter((child) => child.kind === 'directory' && child.name === String(packageName))
              .map((child) => `${groupPath}/${child.name}`);
          })
          .at(0);

    const packageDir = groupChildMatch ?? directPackageDir;
    const srcPath = `${packageDir}/src`;
    const packageJsonPath = `${packageDir}/package.json`;
    const result = architecturePackageInventoryBroker({
      packageName: sharedContentTextContract.parse(packageName),
      srcPath,
      packageJsonPath,
    });

    return {
      content: [{ type: 'text', text: contentTextContract.parse(`${banner}\n\n${result}`) }],
    };
  }

  throw new Error(`Unknown architecture tool: ${String(tool)}`);
};
