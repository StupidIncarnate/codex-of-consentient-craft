/**
 * Pins `ts-jest/ts-source-transformer.js`, the transformer the published `jest-config-base.js` runs
 * on every TypeScript file: its cache key follows the jest.mock() calls hoisted out of the proxy
 * files a test imports, not just the test file's own text. Real files on disk, because the key
 * walks the proxy chain off disk.
 */

import { createHash } from '#gateway/node/crypto';
import { rmSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { installTestbedCreateBroker } from './brokers/install-testbed/create/install-testbed-create-broker';
import { createTransformer, proxyMockCacheKey } from '../ts-jest/ts-source-transformer';
import publishedTsJestOptions from '../ts-jest/published-options';

const TEST_SOURCE = "import { widgetProxy } from './widget.proxy';\n";

const WIDGET_PROXY_SOURCE = [
  "import { readAdapterProxy } from '../testing';",
  '',
  'export const widgetProxy = () => {',
  '  readAdapterProxy();',
  '};',
  '',
].join('\n');

const READ_ADAPTER_PROXY_SOURCE = [
  "import { readAdapter } from './read-adapter';",
  "import { registerMock } from '@dungeonmaster/testing/register-mock';",
  '',
  'export const readAdapterProxy = () => {',
  '  registerMock({ fn: readAdapter });',
  '};',
  '',
].join('\n');

const OLD_ADAPTER_DIR = 'src/adapters/read';

const NEW_ADAPTER_DIR = 'src/adapters/fs/read';

const mockCallsKey = ({ adapterDir }: { adapterDir: string }): string =>
  `proxy-mocks:${createHash('sha256')
    .update(
      JSON.stringify([
        {
          moduleName: `${adapterDir}/read-adapter`,
          factory: null,
          sourceFile: `${adapterDir}/read-adapter.proxy.ts`,
          identifierNames: ['readAdapter'],
          objectIdentifierNames: [],
        },
      ]),
    )
    .digest('hex')}`;

describe('ts-source-transformer', () => {
  describe('proxyMockCacheKey()', () => {
    it('VALID: {a barrel re-export moves the proxied adapter, test and proxy text unchanged} => key follows the moved path', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'ts-source-transformer-move' });
      testbed.writeFile({
        relativePath: 'src/widget/widget.proxy.ts',
        content: WIDGET_PROXY_SOURCE,
      });
      testbed.writeFile({
        relativePath: 'src/testing.ts',
        content: `export * from './adapters/read/read-adapter.proxy';\n`,
      });
      testbed.writeFile({
        relativePath: `${OLD_ADAPTER_DIR}/read-adapter.proxy.ts`,
        content: READ_ADAPTER_PROXY_SOURCE,
      });
      const filePath = join(testbed.guildPath, 'src', 'widget', 'widget.test.ts');

      const keyBeforeMove = proxyMockCacheKey({ source: TEST_SOURCE, filePath });

      rmSync(join(testbed.guildPath, OLD_ADAPTER_DIR), { recursive: true, force: true });
      testbed.writeFile({
        relativePath: `${NEW_ADAPTER_DIR}/read-adapter.proxy.ts`,
        content: READ_ADAPTER_PROXY_SOURCE,
      });
      testbed.writeFile({
        relativePath: 'src/testing.ts',
        content: `export * from './adapters/fs/read/read-adapter.proxy';\n`,
      });

      const keyAfterMove = proxyMockCacheKey({ source: TEST_SOURCE, filePath });
      testbed.cleanup();

      expect({ keyBeforeMove, keyAfterMove }).toStrictEqual({
        keyBeforeMove: mockCallsKey({ adapterDir: join(testbed.guildPath, OLD_ADAPTER_DIR) }),
        keyAfterMove: mockCallsKey({ adapterDir: join(testbed.guildPath, NEW_ADAPTER_DIR) }),
      });
    });

    it('VALID: {a proxy the test never reaches changes} => key stays the same', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'ts-source-transformer-unrelated' });
      testbed.writeFile({
        relativePath: 'src/widget/widget.proxy.ts',
        content: WIDGET_PROXY_SOURCE,
      });
      testbed.writeFile({
        relativePath: 'src/testing.ts',
        content: `export * from './adapters/read/read-adapter.proxy';\n`,
      });
      testbed.writeFile({
        relativePath: `${OLD_ADAPTER_DIR}/read-adapter.proxy.ts`,
        content: READ_ADAPTER_PROXY_SOURCE,
      });
      testbed.writeFile({
        relativePath: 'src/other/other.proxy.ts',
        content: "import { other } from './other';\nregisterMock({ fn: other });\n",
      });
      const filePath = join(testbed.guildPath, 'src', 'widget', 'widget.test.ts');

      const keyBefore = proxyMockCacheKey({ source: TEST_SOURCE, filePath });

      testbed.writeFile({
        relativePath: 'src/other/other.proxy.ts',
        content: "import { renamed } from './renamed';\nregisterMock({ fn: renamed });\n",
      });

      const keyAfter = proxyMockCacheKey({ source: TEST_SOURCE, filePath });
      testbed.cleanup();

      expect({ keyBefore, keyAfter }).toStrictEqual({
        keyBefore: mockCallsKey({ adapterDir: join(testbed.guildPath, OLD_ADAPTER_DIR) }),
        keyAfter: mockCallsKey({ adapterDir: join(testbed.guildPath, OLD_ADAPTER_DIR) }),
      });
    });

    it('EMPTY: {file is not a test file} => returns the constant no-proxy key', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'ts-source-transformer-non-test' });
      const filePath = join(testbed.guildPath, 'src', 'widget', 'widget.ts');

      const key = proxyMockCacheKey({ source: TEST_SOURCE, filePath });
      testbed.cleanup();

      expect(key).toBe('proxy-mocks:none');
    });
  });

  describe('createTransformer()', () => {
    it('VALID: {test file whose proxied adapter moved} => getCacheKey and getCacheKeyAsync end with the moved mock key', async () => {
      const testbed = installTestbedCreateBroker({ baseName: 'ts-source-transformer-full-key' });
      testbed.writeFile({
        relativePath: 'src/widget/widget.proxy.ts',
        content: WIDGET_PROXY_SOURCE,
      });
      testbed.writeFile({
        relativePath: 'src/testing.ts',
        content: `export * from './adapters/fs/read/read-adapter.proxy';\n`,
      });
      testbed.writeFile({
        relativePath: `${NEW_ADAPTER_DIR}/read-adapter.proxy.ts`,
        content: READ_ADAPTER_PROXY_SOURCE,
      });
      const filePath = join(testbed.guildPath, 'src', 'widget', 'widget.test.ts');
      const transformer = createTransformer(publishedTsJestOptions);

      const syncKey = transformer.getCacheKey(TEST_SOURCE, filePath, {
        config: {
          cwd: testbed.guildPath,
          rootDir: testbed.guildPath,
          globals: {},
          testMatch: [],
          testRegex: [],
          moduleFileExtensions: ['ts', 'js'],
          extensionsToTreatAsEsm: [],
          setupFiles: [],
          setupFilesAfterEnv: [],
          cacheDirectory: join(testbed.guildPath, 'jest-cache'),
        },
        cacheFS: new Map(),
        instrument: false,
        transformerConfig: publishedTsJestOptions,
        configString: '{}',
      });
      const asyncKey = await transformer.getCacheKeyAsync(TEST_SOURCE, filePath, {
        config: {
          cwd: testbed.guildPath,
          rootDir: testbed.guildPath,
          globals: {},
          testMatch: [],
          testRegex: [],
          moduleFileExtensions: ['ts', 'js'],
          extensionsToTreatAsEsm: [],
          setupFiles: [],
          setupFilesAfterEnv: [],
          cacheDirectory: join(testbed.guildPath, 'jest-cache'),
        },
        cacheFS: new Map(),
        instrument: false,
        transformerConfig: publishedTsJestOptions,
        configString: '{}',
      });
      testbed.cleanup();

      const movedKey = mockCallsKey({ adapterDir: join(testbed.guildPath, NEW_ADAPTER_DIR) });

      expect({
        syncKeyEnd: syncKey.slice(-movedKey.length - 1),
        asyncKeyEnd: asyncKey.slice(-movedKey.length - 1),
      }).toStrictEqual({ syncKeyEnd: `:${movedKey}`, asyncKeyEnd: `:${movedKey}` });
    });
  });
});
