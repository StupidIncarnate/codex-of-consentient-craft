/**
 * PURPOSE: A Vite `UserConfig`, typed against vite's own ESM declaration through this subpath's
 * barrel — for a caller staging a config value instead of hand-typing its shape.
 *
 * USAGE:
 * const config = ViteUserConfigStub({ cacheDir: 'node_modules/.vite-40001' });
 * // Returns { cacheDir: 'node_modules/.vite-40001' }
 */
import type { UserConfig } from '../vite';

export const ViteUserConfigStub = ({
  cacheDir = 'node_modules/.vite',
}: {
  cacheDir?: string;
} = {}): UserConfig => ({ cacheDir });
