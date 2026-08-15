/**
 * PURPOSE: Resolves a repo-relative path to the quest package that owns it, by longest declared
 * `location` prefix — the one rule three separate surfaces need and must agree on
 *
 * USAGE:
 * packageForPathTransformer({ path: 'packages/web/src/widgets/x.tsx', packagesAffected });
 * // Returns the owning PackageName, or undefined when the path sits under no declared location
 *
 * The declared locations are the ONLY source. No layout is assumed and no package name is read out
 * of a path, because a quest may run in a repo that does not put its packages under `packages/` at
 * all, and the same directory name may mean different things in different repos. A path under none
 * of them resolves to `undefined` rather than to the nearest guess: inventing an owner silently
 * widens a real package's scope with files nobody declared.
 *
 * LONGEST PREFIX WINS, so a package declared inside another package's tree claims its own paths
 * instead of losing them to the enclosing declaration.
 *
 * Both sides arrive in mixed shapes — a declared location is `./`-prefixed by convention while the
 * path being resolved is usually bare — so each is reduced to one repo-relative form before they
 * are compared. Trailing slashes go too, or `./packages/web/` would never match `packages/web`.
 */

import type { PackageName } from '../../contracts/package-name/package-name-contract';
import type { QuestPackageEntry } from '../../contracts/quest-package-entry/quest-package-entry-contract';

export const packageForPathTransformer = ({
  path,
  packagesAffected,
}: {
  path: string;
  packagesAffected: readonly QuestPackageEntry[];
}): PackageName | undefined =>
  packagesAffected
    .map((entry) => ({
      name: entry.name,
      prefix: String(entry.location).replace(/^\.\//u, '').replace(/\/+$/u, ''),
    }))
    .filter((declared) => declared.prefix.length > 0)
    .sort((left, right) => right.prefix.length - left.prefix.length)
    .find((declared) => {
      const reduced = path.replace(/^\.\//u, '').replace(/\/+$/u, '');
      return reduced === declared.prefix || reduced.startsWith(`${declared.prefix}/`);
    })?.name;
