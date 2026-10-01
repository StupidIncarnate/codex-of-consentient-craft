/**
 * PURPOSE: Returns true for a repo-relative path that is a production `-contract.ts` file under a
 * `contracts/` folder, layer contracts included. Reach for this over isProductionSourceFileGuard
 * when a scan wants the contract files alone, such as the owner index deciding which files to read.
 *
 * USAGE:
 * isContractSourceFileGuard({ relativePath: 'packages/a/src/contracts/quest/quest-contract.ts' });
 * // Returns true — a production contract file
 */
import { isProductionSourceFileGuard } from '../is-production-source-file/is-production-source-file-guard';

const CONTRACT_FILE_PATTERN = /\/contracts\/(?:.*\/)?[^/]+-contract\.ts$/u;

export const isContractSourceFileGuard = ({ relativePath }: { relativePath?: string }): boolean => {
  if (relativePath === undefined) {
    return false;
  }
  return (
    CONTRACT_FILE_PATTERN.test(`/${relativePath}`) && isProductionSourceFileGuard({ relativePath })
  );
};
