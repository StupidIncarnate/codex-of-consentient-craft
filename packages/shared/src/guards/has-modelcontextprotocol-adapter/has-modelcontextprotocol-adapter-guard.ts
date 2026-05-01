/**
 * PURPOSE: Returns true when the adapter directory names include '@modelcontextprotocol'
 *
 * USAGE:
 * hasModelcontextprotocolAdapterGuard({ adapterDirNames: ['@modelcontextprotocol', 'fs'] });
 * // Returns true — '@modelcontextprotocol' is present
 */

export const hasModelcontextprotocolAdapterGuard = ({
  adapterDirNames,
}: {
  adapterDirNames?: string[];
}): boolean => {
  if (adapterDirNames === undefined) {
    return false;
  }
  return adapterDirNames.includes('@modelcontextprotocol');
};
