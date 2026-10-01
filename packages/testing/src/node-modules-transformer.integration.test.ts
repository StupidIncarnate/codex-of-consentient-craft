/**
 * Pins `ts-jest/node-modules-transformer.js`, the transformer the published `jest-config-base.js`
 * runs on every `node_modules` script file: which files it calls ESM (sent through ts-jest) and
 * which it calls CommonJS (handed back untouched). A false CommonJS fails a consumer's test on raw
 * `import` syntax; a false ESM only costs a compile — so every ambiguous shape below must land ESM
 * or be provably CommonJS. Real files on disk, because the rule reads the nearest `package.json`.
 */

import { createHash } from '#gateway/node/crypto';
import { join } from '#gateway/node/path';
import { installTestbedCreateBroker } from './brokers/install-testbed/create/install-testbed-create-broker';
import {
  createTransformer,
  nodeModulesModuleKind,
  NODE_MODULES_TRANSFORMER_VERSION,
} from '../ts-jest/node-modules-transformer';
import publishedTsJestOptions from '../ts-jest/published-options';

const CJS_SOURCE = "'use strict';\nmodule.exports = { answer: 42 };\n";

const ESM_SOURCE = 'export const answer = 42;\n';

describe('node-modules-transformer', () => {
  describe('nodeModulesModuleKind()', () => {
    it('VALID: {.mjs file holding CommonJS-valid source} => returns esm', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-mjs' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.mjs');

      const kind = nodeModulesModuleKind({ source: CJS_SOURCE, filePath });
      testbed.cleanup();

      expect(kind).toBe('esm');
    });

    it('VALID: {.cjs file inside a "type": "module" package} => returns cjs', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-cjs' });
      testbed.writeFile({
        relativePath: 'node_modules/dep/package.json',
        content: JSON.stringify({ name: 'dep', type: 'module' }),
      });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.cjs');

      const kind = nodeModulesModuleKind({ source: CJS_SOURCE, filePath });
      testbed.cleanup();

      expect(kind).toBe('cjs');
    });

    it('VALID: {.js file, nearest package.json "type": "module", CommonJS-valid source} => returns esm', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-type-module' });
      testbed.writeFile({
        relativePath: 'node_modules/dep/package.json',
        content: JSON.stringify({ name: 'dep', type: 'module' }),
      });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'lib', 'index.js');

      const kind = nodeModulesModuleKind({ source: CJS_SOURCE, filePath });
      testbed.cleanup();

      expect(kind).toBe('esm');
    });

    it('VALID: {.js file, nearest package.json "type": "commonjs" nested inside a "type": "module" package} => returns cjs', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-nested-type' });
      testbed.writeFile({
        relativePath: 'node_modules/dep/package.json',
        content: JSON.stringify({ name: 'dep', type: 'module' }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/dep/cjs/package.json',
        content: JSON.stringify({ type: 'commonjs' }),
      });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'cjs', 'index.js');

      const kind = nodeModulesModuleKind({ source: CJS_SOURCE, filePath });
      testbed.cleanup();

      expect(kind).toBe('cjs');
    });

    it('VALID: {.js file with module.exports, package.json without "type"} => returns cjs', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-plain-cjs' });
      testbed.writeFile({
        relativePath: 'node_modules/dep/package.json',
        content: JSON.stringify({ name: 'dep' }),
      });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');

      const kind = nodeModulesModuleKind({ source: CJS_SOURCE, filePath });
      testbed.cleanup();

      expect(kind).toBe('cjs');
    });

    it('VALID: {.js file with static export, package.json without "type"} => returns esm', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-untyped-esm' });
      testbed.writeFile({
        relativePath: 'node_modules/dep/package.json',
        content: JSON.stringify({ name: 'dep' }),
      });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');

      const kind = nodeModulesModuleKind({ source: ESM_SOURCE, filePath });
      testbed.cleanup();

      expect(kind).toBe('esm');
    });

    it('VALID: {.js file with a static import, package.json without "type"} => returns esm', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-static-import' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');

      const kind = nodeModulesModuleKind({
        source: "import { join } from 'path';\nmodule.exports = join('a', 'b');\n",
        filePath,
      });
      testbed.cleanup();

      expect(kind).toBe('esm');
    });

    it('VALID: {.js file reading import.meta, package.json without "type"} => returns esm', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-import-meta' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');

      const kind = nodeModulesModuleKind({
        source: 'module.exports = import.meta.url;\n',
        filePath,
      });
      testbed.cleanup();

      expect(kind).toBe('esm');
    });

    it('VALID: {CommonJS .js file naming import/export inside strings and comments} => returns cjs', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-import-word' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');

      const kind = nodeModulesModuleKind({
        source: [
          '// import { x } from "y";',
          '/* export default 1; */',
          'const hint = \'import { a } from "b"; export const c = 1;\';',
          'const tpl = `\nimport z from "z";\nexport { z };\n`;',
          'module.exports = { hint, tpl };',
          '',
        ].join('\n'),
        filePath,
      });
      testbed.cleanup();

      expect(kind).toBe('cjs');
    });

    it('VALID: {CommonJS .js file with dynamic import()} => returns cjs', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-dynamic-import' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');

      const kind = nodeModulesModuleKind({
        source: "module.exports = async () => import('./other.mjs');\n",
        filePath,
      });
      testbed.cleanup();

      expect(kind).toBe('cjs');
    });

    it('VALID: {CommonJS .js file opening with a hashbang} => returns cjs', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-hashbang' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'bin.js');

      const kind = nodeModulesModuleKind({
        source: `#!/usr/bin/env node\n${CJS_SOURCE}`,
        filePath,
      });
      testbed.cleanup();

      expect(kind).toBe('cjs');
    });

    it('EDGE: {.js file whose nearest package.json is invalid JSON, CommonJS source} => returns cjs', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-bad-package-json' });
      testbed.writeFile({ relativePath: 'node_modules/dep/package.json', content: '{ not json' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');

      const kind = nodeModulesModuleKind({ source: CJS_SOURCE, filePath });
      testbed.cleanup();

      expect(kind).toBe('cjs');
    });

    it('EDGE: {.js file whose nearest package.json is invalid JSON, ESM source} => returns esm', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-bad-json-esm' });
      testbed.writeFile({ relativePath: 'node_modules/dep/package.json', content: '{ not json' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');

      const kind = nodeModulesModuleKind({ source: ESM_SOURCE, filePath });
      testbed.cleanup();

      expect(kind).toBe('esm');
    });
  });

  describe('createTransformer()', () => {
    it('VALID: {ESM .js file} => process returns ts-jest CommonJS output', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-process-esm' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');
      const transformer = createTransformer(publishedTsJestOptions);

      const { code } = transformer.process(ESM_SOURCE, filePath, {
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
      });
      testbed.cleanup();

      expect(code.split('\n//# sourceMappingURL=')[0]).toBe(
        [
          '"use strict";',
          'Object.defineProperty(exports, "__esModule", { value: true });',
          'exports.answer = void 0;',
          'exports.answer = 42;',
        ].join('\n'),
      );
    });

    it('VALID: {CommonJS .js file} => process returns the source byte-identical', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-process-cjs' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');
      const transformer = createTransformer(publishedTsJestOptions);

      const result = transformer.process(CJS_SOURCE, filePath, {});
      testbed.cleanup();

      expect(result).toStrictEqual({ code: CJS_SOURCE });
    });

    it('VALID: {CommonJS .js file} => processAsync returns the source byte-identical', async () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-process-async-cjs' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');
      const transformer = createTransformer(publishedTsJestOptions);

      const result = await transformer.processAsync(CJS_SOURCE, filePath, {});
      testbed.cleanup();

      expect(result).toStrictEqual({ code: CJS_SOURCE });
    });

    it('VALID: {CommonJS .js file} => getCacheKey and getCacheKeyAsync return the sha256 of version, decision, path and source', async () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-cache-key-cjs' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');
      const transformer = createTransformer(publishedTsJestOptions);

      const syncKey = transformer.getCacheKey(CJS_SOURCE, filePath, {});
      const asyncKey = await transformer.getCacheKeyAsync(CJS_SOURCE, filePath, {});
      testbed.cleanup();

      const expectedKey = createHash('sha256')
        .update(`${NODE_MODULES_TRANSFORMER_VERSION}\0cjs\0${filePath}\0${CJS_SOURCE}`)
        .digest('hex');

      expect(syncKey).toBe(expectedKey);
      expect(asyncKey).toBe(expectedKey);
    });

    it('VALID: {CommonJS source one byte longer at the same path} => getCacheKey returns that source hash', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-cache-key-source' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');
      const transformer = createTransformer(publishedTsJestOptions);
      const longerSource = `${CJS_SOURCE}\n`;

      const key = transformer.getCacheKey(longerSource, filePath, {});
      testbed.cleanup();

      expect(key).toBe(
        createHash('sha256')
          .update(`${NODE_MODULES_TRANSFORMER_VERSION}\0cjs\0${filePath}\0${longerSource}`)
          .digest('hex'),
      );
    });

    it('VALID: {ESM .js file} => getCacheKey carries the transformer version and the esm decision', () => {
      const testbed = installTestbedCreateBroker({ baseName: 'nm-transformer-cache-key-esm' });
      const filePath = join(testbed.guildPath, 'node_modules', 'dep', 'index.js');
      const transformer = createTransformer(publishedTsJestOptions);

      const key = transformer.getCacheKey(ESM_SOURCE, filePath, {
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

      expect(key.split(':').slice(0, 2)).toStrictEqual([NODE_MODULES_TRANSFORMER_VERSION, 'esm']);
    });
  });
});
