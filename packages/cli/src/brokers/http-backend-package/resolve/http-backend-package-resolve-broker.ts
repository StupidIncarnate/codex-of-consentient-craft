/**
 * PURPOSE: Finds which of @dungeonmaster/cli's own dependencies fronts an HTTP server, so
 *   CliServeResponder never hardcodes a package name a fork or a future split could rename to
 *   something else, or answer with more than one package. A published install ships no source
 *   tree, so the folder-structure signal `hasHonoOrExpressAdapterGuard` reads is unavailable here —
 *   this reads the same underlying fact (does the candidate front something over `hono`) straight
 *   from that candidate's own package.json `dependencies`, which ships with every install.
 *
 * USAGE:
 * const packageName = await httpBackendPackageResolveBroker();
 * // Returns PackageName('@dungeonmaster/server') — throws if none or several dependencies qualify
 */
import {
  absoluteFilePathContract,
  filePathContract,
  packageJsonContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import type { PackageName } from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { fsReadFileSyncAdapter } from '@dungeonmaster/shared/adapters';

const HTTP_BACKEND_DEPENDENCY_SIGNAL = 'hono';
const SCOPE_PREFIX = '@dungeonmaster/';

export const httpBackendPackageResolveBroker = async (): Promise<PackageName> => {
  const projectRoot = await cwdResolveBroker({
    startPath: filePathContract.parse(__dirname),
    kind: 'project-root',
  });
  const ownPackageJson = packageJsonContract.parse(
    JSON.parse(
      fsReadFileSyncAdapter({
        filePath: absoluteFilePathContract.parse(`${projectRoot}/package.json`),
      }),
    ) as unknown,
  );

  const candidateNames = Object.keys(ownPackageJson.dependencies ?? {})
    .filter((name) => name.startsWith(SCOPE_PREFIX))
    .map((name) => packageNameContract.parse(name));

  const matches = candidateNames.filter((candidateName) => {
    try {
      const candidatePackageJson = packageJsonContract.parse(
        JSON.parse(
          fsReadFileSyncAdapter({
            filePath: absoluteFilePathContract.parse(
              require.resolve(`${candidateName}/package.json`),
            ),
          }),
        ) as unknown,
      );
      return Object.keys(candidatePackageJson.dependencies ?? {}).includes(
        HTTP_BACKEND_DEPENDENCY_SIGNAL,
      );
    } catch {
      // A dependency whose own `exports` field omits `./package.json` throws on resolve; that
      // candidate is simply not a match, the same as one that resolves but declares no `hono`
      // dependency of its own.
      return false;
    }
  });

  const [match, ...extraMatches] = matches;
  if (match === undefined) {
    throw new Error(
      `No http-backend package found among this package's own @dungeonmaster/* dependencies (checked: ${candidateNames.join(', ')}). A backend dependency must declare 'hono' among its own dependencies.`,
    );
  }
  if (extraMatches.length > 0) {
    throw new Error(
      `Ambiguous http-backend package — more than one @dungeonmaster/* dependency declares 'hono': ${[match, ...extraMatches].join(', ')}.`,
    );
  }

  return match;
};
