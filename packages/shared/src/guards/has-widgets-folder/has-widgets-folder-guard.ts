/**
 * PURPOSE: Returns true when the src directory names include 'widgets'
 *
 * USAGE:
 * hasWidgetsFolderGuard({ srcDirNames: ['widgets', 'brokers'] });
 * // Returns true — 'widgets' is present
 */

export const hasWidgetsFolderGuard = ({ srcDirNames }: { srcDirNames?: string[] }): boolean => {
  if (srcDirNames === undefined) {
    return false;
  }
  return srcDirNames.includes('widgets');
};
