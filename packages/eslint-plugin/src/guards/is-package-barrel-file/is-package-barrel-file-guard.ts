/**
 * PURPOSE: Tells whether a file is a package's folder-type barrel, the file named after its own folder directly under `src/` (`src/contracts/contracts.ts`, `src/@types/@types.ts`). A package's `exports` wildcard key resolves a subpath import to that one path. A same-named file one folder deeper (`src/contracts/contracts/contracts.ts`) is not one. Pair with isReexportOnlyProgramGuard, which checks the file holds nothing but re-exports.
 *
 * USAGE:
 * isPackageBarrelFileGuard({ filename: '/repo/packages/shared/src/contracts/contracts.ts' });
 * // Returns true
 * isPackageBarrelFileGuard({ filename: '/repo/packages/shared/src/contracts/user/user-contract.ts' });
 * // Returns false
 */
import { folderConfigStatics } from '@dungeonmaster/shared/statics';
import { packageBarrelStatics } from '../../statics/package-barrel/package-barrel-statics';

const barrelFolders = [...Object.keys(folderConfigStatics), ...packageBarrelStatics.extraFolders];

export const isPackageBarrelFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (!filename) {
    return false;
  }

  const [fileName, folderName, parentFolderName] = filename.split('/').reverse();

  return (
    parentFolderName === 'src' &&
    folderName !== undefined &&
    barrelFolders.includes(folderName) &&
    fileName === `${folderName}.ts`
  );
};
