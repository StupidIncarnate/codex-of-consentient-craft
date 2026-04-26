/**
 * PURPOSE: Adapter for loading a CommonJS module fresh (cache-busted) using createRequire
 *
 * USAGE:
 * const loaded: unknown = moduleRequireFreshAdapter({ filePath: '/path/to/config.js' });
 * // Loads the module at filePath, clearing its require cache first
 */
import { createRequire } from 'module';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

const req = createRequire(__filename);

export const moduleRequireFreshAdapter = ({ filePath }: { filePath: FilePath }): unknown => {
  Reflect.deleteProperty(req.cache, filePath);
  return req(filePath);
};
