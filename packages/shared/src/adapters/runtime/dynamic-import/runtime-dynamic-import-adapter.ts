/**
 * PURPOSE: Wraps the native import() for mockability in tests
 *
 * USAGE:
 * import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
 * const module = await runtimeDynamicImportAdapter<{ myExport: string }>({ path: '/path/to/module.ts' });
 *
 * WHY: import() is a language primitive, not an npm package.
 * This adapter allows proxies to mock it like they mock fs/promises.
 */
import { filePathContract } from '../../../contracts/file-path/file-path-contract';

export const runtimeDynamicImportAdapter = async <T = unknown>({
  path,
}: {
  path: string;
}): Promise<T> => import(filePathContract.parse(path)) as Promise<T>;
