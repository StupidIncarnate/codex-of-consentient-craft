/**
 * PURPOSE: Returns true when the adapter directory names include 'ink'
 *
 * USAGE:
 * hasInkAdapterGuard({ adapterDirNames: ['ink', 'fs'] });
 * // Returns true — 'ink' is present
 */

export const hasInkAdapterGuard = ({
  adapterDirNames,
}: {
  adapterDirNames?: string[];
}): boolean => {
  if (adapterDirNames === undefined) {
    return false;
  }
  return adapterDirNames.includes('ink');
};
