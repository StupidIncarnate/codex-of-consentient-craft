/**
 * PURPOSE: Returns true when the adapter directory names include 'hono' or 'express'
 *
 * USAGE:
 * hasHonoOrExpressAdapterGuard({ adapterDirNames: ['hono', 'fs'] });
 * // Returns true — 'hono' is present
 */

export const hasHonoOrExpressAdapterGuard = ({
  adapterDirNames,
}: {
  adapterDirNames?: string[];
}): boolean => {
  if (adapterDirNames === undefined) {
    return false;
  }
  return adapterDirNames.includes('hono') || adapterDirNames.includes('express');
};
