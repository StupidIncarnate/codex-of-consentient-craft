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
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, PackageName } from '@dungeonmaster/shared/contracts';
import { existsSync, readFileSync } from '#gateway/node/fs';
import { fsReaddirSyncAdapter } from '../../../adapters/fs/readdir-sync/fs-readdir-sync-adapter';
import { gatewayConsumerPackageJsonContract } from '../../../contracts/gateway-consumer-package-json/gateway-consumer-package-json-contract';

const WILDCARD_SUFFIX = '/*';

export const resolveWorkspaceGlobLayerBroker = ({
  rootDir,
  glob,
}: {
  rootDir: FilePath;
  glob: string;
}): PackageName[] => {
  const memberDirs: FilePath[] = glob.endsWith(WILDCARD_SUFFIX)
    ? ((): FilePath[] => {
        const baseDir = glob.slice(0, glob.length - WILDCARD_SUFFIX.length);
        const basePath = filePathContract.parse(`${rootDir}/${baseDir}`);

        if (!existsSync(basePath)) {
          return [];
        }

        return fsReaddirSyncAdapter({ dirPath: basePath })
          .filter((entry) => entry.isDirectory)
          .map((entry) => filePathContract.parse(`${basePath}/${entry.name}`));
      })()
    : [filePathContract.parse(`${rootDir}/${glob}`)];

  return memberDirs
    .map((memberDir): PackageName | null => {
      const memberPackageJsonPath = filePathContract.parse(`${memberDir}/package.json`);

      if (!existsSync(memberPackageJsonPath)) {
        return null;
      }

      try {
        const contents = readFileSync(memberPackageJsonPath);
        const parsed: unknown = JSON.parse(contents);
        const memberPackageJson = gatewayConsumerPackageJsonContract.safeParse(parsed);
        return memberPackageJson.success ? memberPackageJson.data.name : null;
      } catch {
        return null;
      }
    })
    .flatMap((name) => (name === null ? [] : [name]));
};
