/**
 * PURPOSE: Proxy for eslint-load-config-broker that delegates to adapter proxies
 *
 * USAGE:
 * const proxy = eslintLoadConfigBrokerProxy();
 * const config = await eslintLoadConfigBroker({ cwd: '/project/path', filePath: 'src/file.ts' });
 */

import { eslintEslintAdapterProxy } from '../../../adapters/eslint/eslint/eslint-eslint-adapter.proxy';
import { eslintCalculateConfigForFileAdapterProxy } from '../../../adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter.proxy';

export const eslintLoadConfigBrokerProxy = (): Record<PropertyKey, never> => {
  eslintEslintAdapterProxy();
  eslintCalculateConfigForFileAdapterProxy();
  return {};
};
