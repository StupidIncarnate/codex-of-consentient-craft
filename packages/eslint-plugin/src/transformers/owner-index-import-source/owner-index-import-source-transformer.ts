/**
 * PURPOSE: Writes the module specifier a fix imports an owner's contract or type from. Inside one
 * package it is the relative path to the owner's contract file, since a package's own barrel is
 * private to its consumers; across packages it is the owner package's `contracts` subpath.
 *
 * USAGE:
 * ownerIndexImportSourceTransformer({ ownerFilePath, ownerPackageName, filePath, packageName });
 * // Returns '../quest/quest-contract' in one package, '@repo/shared/contracts' across two
 */
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, PackageName } from '@dungeonmaster/shared/contracts';

const CONTRACTS_SUBPATH = 'contracts';
const EXTENSION = /\.tsx?$/u;

export const ownerIndexImportSourceTransformer = ({
  ownerFilePath,
  ownerPackageName,
  filePath,
  packageName,
}: {
  ownerFilePath: string;
  ownerPackageName: PackageName;
  filePath: string;
  packageName: PackageName;
}): ContentText => {
  if (ownerPackageName !== packageName) {
    return contentTextContract.parse(`${ownerPackageName}/${CONTRACTS_SUBPATH}`);
  }

  const fromFolders = filePath.split('/').slice(0, -1);
  const toSegments = ownerFilePath.replace(EXTENSION, '').split('/');
  const shared = fromFolders.findIndex((folder, at) => folder !== toSegments[at]);
  const common = shared === -1 ? fromFolders.length : shared;
  const climbs = fromFolders.length - common;
  const prefix = climbs === 0 ? './' : '../'.repeat(climbs);

  return contentTextContract.parse(`${prefix}${toSegments.slice(common).join('/')}`);
};
