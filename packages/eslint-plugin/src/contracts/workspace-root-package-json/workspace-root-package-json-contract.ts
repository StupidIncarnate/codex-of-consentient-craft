/**
 * PURPOSE: Validates a parsed `package.json` as the npm-workspaces ROOT — the one whose `name`
 * field raw-import-ban's repo-scope walk reads. Zod's `.safeParse()` is what tells a nested
 * workspace package's own package.json (no `workspaces` field) apart from the root, without
 * `Reflect.get` outside a guard or contract file.
 *
 * USAGE:
 * workspaceRootPackageJsonContract.safeParse({ name: 'dungeonmaster', workspaces: ['packages/*'] });
 * // Returns { success: true, data: { name: 'dungeonmaster', workspaces: [...] } }
 */
import { z } from 'zod';

export const workspaceRootPackageJsonContract = z
  .object({
    name: z.string().brand<'PackageJsonName'>(),
    workspaces: z.union([
      z.array(z.string().brand<'WorkspaceGlob'>()),
      z.record(z.string().brand<'WorkspaceGlob'>(), z.unknown()),
    ]),
  })
  .passthrough();

export type WorkspaceRootPackageJson = z.infer<typeof workspaceRootPackageJsonContract>;
