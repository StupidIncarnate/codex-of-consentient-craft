/**
 * PURPOSE: Resolves ONE workspace glob pattern (`packages/*`, `packages/@gateway/*`, or a literal
 * non-wildcard entry) to the real package names its member directories carry, read from each
 * member's OWN package.json `name` field — never the workspaces ROOT's `dependencies`/
 * `devDependencies` (`workspaceRootFindBroker`'s list), which a member need not appear in for
 * `npm install` to still link it. A missing member directory, or a member with no readable or
 * valid package.json, contributes no name rather than throwing, so one malformed package never
 * breaks the scan `ban-workspace-export-mocks`' option depends on.
 *
 * USAGE:
 * resolveWorkspaceGlobLayerBroker({ rootDir: filePathContract.parse('/repo'), glob: 'packages/*' });
 * // Returns ['@dungeonmaster/orchestrator', '@dungeonmaster/server', ...]
 */
import { existsSync, readFileSync, readdirEntriesSync } from '#gateway/node/fs';
import { gatewayConsumerPackageJsonContract } from '../../../contracts/gateway-consumer-package-json/gateway-consumer-package-json-contract';

const WILDCARD_SUFFIX = '/*';

export const resolveWorkspaceGlobLayerBroker = ({
  rootDir,
  glob,
}: {
  rootDir: string;
  glob: string;
}): string[] => {
  const memberDirs: string[] = glob.endsWith(WILDCARD_SUFFIX)
    ? ((): string[] => {
        const baseDir = glob.slice(0, glob.length - WILDCARD_SUFFIX.length);
        const basePath = `${rootDir}/${baseDir}`;

        if (!existsSync(basePath)) {
          return [];
        }

        return readdirEntriesSync(basePath)
          .filter((entry) => entry.kind === 'directory')
          .map((entry) => `${basePath}/${entry.name}`);
      })()
    : [`${rootDir}/${glob}`];

  return memberDirs
    .map((memberDir): string | null => {
      const memberPackageJsonPath = `${memberDir}/package.json`;

      if (!existsSync(memberPackageJsonPath)) {
        return null;
      }

      try {
        const contents = readFileSync(memberPackageJsonPath);
        const memberPackageJson = gatewayConsumerPackageJsonContract.safeParse(
          JSON.parse(contents),
        );
        return memberPackageJson.success ? memberPackageJson.data.name : null;
      } catch {
        return null;
      }
    })
    .flatMap((name) => (name === null ? [] : [name]));
};
