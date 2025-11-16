import { mergeConfigsTransformer } from './merge-configs-transformer';
import { QuestmaestroConfigStub } from '../../contracts/questmaestro-config/questmaestro-config.stub';

describe('mergeConfigsTransformer', () => {
  describe('empty configs array', () => {
    it('EMPTY: {configs: []} => throws "Cannot merge empty configs array"', () => {
      expect(() => {
        return mergeConfigsTransformer({ configs: [] });
      }).toThrow('Cannot merge empty configs array');
    });
  });

  describe('single config', () => {
    it('VALID: {configs: [singleConfig]} => returns same config', () => {
      const config = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        routing: 'react-router-dom',
        architecture: {
          overrides: {
            widgets: { add: ['styled-components'] },
          },
          allowedRootFiles: ['custom.d.ts'],
          booleanFunctionPrefixes: ['check'],
        },
      });

      const result = mergeConfigsTransformer({ configs: [config] });

      expect(result).toStrictEqual(config);
    });
  });

  describe('two configs merging', () => {
    it('VALID: monorepo + package config => framework from package wins', () => {
      const monorepoConfig = QuestmaestroConfigStub({
        framework: 'monorepo',
        schema: 'zod',
        architecture: {
          overrides: {
            contracts: { add: ['class-validator'] },
          },
          allowedRootFiles: ['global.d.ts'],
          booleanFunctionPrefixes: ['is', 'has'],
        },
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        routing: 'react-router-dom',
      });

      const result = mergeConfigsTransformer({
        configs: [monorepoConfig, packageConfig],
      });

      const expectedConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        routing: 'react-router-dom',
        architecture: {
          overrides: {
            contracts: { add: ['class-validator'] },
          },
          allowedRootFiles: ['global.d.ts'],
          booleanFunctionPrefixes: ['is', 'has'],
        },
      });

      expect(result).toStrictEqual(expectedConfig);
    });

    it('VALID: base + override config => package routing wins when present', () => {
      const baseConfig = QuestmaestroConfigStub({
        framework: 'vue',
        schema: 'zod',
        routing: 'vue-router',
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'vue',
        schema: 'zod',
        routing: 'vue-router',
      });

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'vue',
        schema: 'zod',
        routing: 'vue-router',
      });
    });

    it('VALID: base + package without routing => base routing preserved', () => {
      const baseConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        routing: 'react-router-dom',
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
      });

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: 'zod',
        routing: 'react-router-dom',
      });
    });

    it('VALID: base + package without schema => base schema preserved', () => {
      const baseConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        routing: 'react-router-dom',
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: ['zod'],
      });

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: ['zod'],
        routing: 'react-router-dom',
      });
    });
  });

  describe('architecture merging', () => {
    it('VALID: base without architecture + package with architecture => package architecture added', () => {
      const baseConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['material-ui'] },
          },
          allowedRootFiles: ['types.d.ts'],
          booleanFunctionPrefixes: ['validate'],
        },
      });

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual(packageConfig);
    });

    it('VALID: base with architecture + package without architecture => base architecture preserved', () => {
      const baseConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            contracts: { add: ['class-validator'] },
          },
          allowedRootFiles: ['global.d.ts'],
          booleanFunctionPrefixes: ['is'],
        },
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
      });

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual(baseConfig);
    });

    it('VALID: both configs with architecture => package settings win, overrides merge', () => {
      const baseConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['react-bootstrap'] },
            state: { add: ['redux'] },
          },
          allowedRootFiles: ['global.d.ts'],
          booleanFunctionPrefixes: ['is', 'has'],
        },
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['material-ui'] },
            bindings: { add: ['react-query'] },
          },
          allowedRootFiles: ['custom.d.ts'],
          booleanFunctionPrefixes: ['check', 'validate'],
        },
      });

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      const expectedConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['material-ui'] },
            state: { add: ['redux'] },
            bindings: { add: ['react-query'] },
          },
          allowedRootFiles: ['custom.d.ts'],
          booleanFunctionPrefixes: ['check', 'validate'],
        },
      });

      expect(result).toStrictEqual(expectedConfig);
    });

    it('VALID: base with overrides + package without overrides => base overrides preserved', () => {
      const baseConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['styled-components'] },
          },
        },
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          allowedRootFiles: ['types.d.ts'],
        },
      });

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      const expectedConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['styled-components'] },
          },
          allowedRootFiles: ['types.d.ts'],
        },
      });

      expect(result).toStrictEqual(expectedConfig);
    });

    it('VALID: base without overrides + package with overrides => package overrides added', () => {
      const baseConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          allowedRootFiles: ['global.d.ts'],
        },
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            state: { add: ['zustand'] },
          },
        },
      });

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      const expectedConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            state: { add: ['zustand'] },
          },
          allowedRootFiles: ['global.d.ts'],
        },
      });

      expect(result).toStrictEqual(expectedConfig);
    });
  });

  describe('three configs merging', () => {
    it('VALID: monorepo + workspace + package => final package settings win', () => {
      const monorepoConfig = QuestmaestroConfigStub({
        framework: 'monorepo',
        schema: 'zod',
        architecture: {
          allowedRootFiles: ['global.d.ts'],
          booleanFunctionPrefixes: ['is'],
        },
      });

      const workspaceConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        routing: 'react-router-dom',
        architecture: {
          overrides: {
            widgets: { add: ['react-bootstrap'] },
          },
          allowedRootFiles: ['workspace.d.ts'],
          booleanFunctionPrefixes: ['has', 'can'],
        },
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            state: { add: ['redux'] },
          },
          booleanFunctionPrefixes: ['check'],
        },
      });

      const result = mergeConfigsTransformer({
        configs: [monorepoConfig, workspaceConfig, packageConfig],
      });

      const expectedConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        routing: 'react-router-dom',
        architecture: {
          overrides: {
            widgets: { add: ['react-bootstrap'] },
            state: { add: ['redux'] },
          },
          allowedRootFiles: ['workspace.d.ts'],
          booleanFunctionPrefixes: ['check'],
        },
      });

      expect(result).toStrictEqual(expectedConfig);
    });

    it('VALID: multiple configs with partial overrides => all overrides accumulate correctly', () => {
      const config1 = QuestmaestroConfigStub({
        framework: 'express',
        schema: 'zod',
        architecture: {
          overrides: {
            adapters: { add: ['axios'] },
            middleware: { add: ['helmet'] },
          },
        },
      });

      const config2 = QuestmaestroConfigStub({
        framework: 'express',
        schema: 'zod',
        architecture: {
          overrides: {
            brokers: { add: ['mongoose'] },
            middleware: { add: ['cors'] },
          },
        },
      });

      const config3 = QuestmaestroConfigStub({
        framework: 'express',
        schema: 'zod',
        architecture: {
          overrides: {
            transformers: { add: ['lodash'] },
            middleware: { add: ['express-rate-limit'] },
          },
        },
      });

      const result = mergeConfigsTransformer({
        configs: [config1, config2, config3],
      });

      const expectedConfig = QuestmaestroConfigStub({
        framework: 'express',
        schema: 'zod',
        architecture: {
          overrides: {
            adapters: { add: ['axios'] },
            brokers: { add: ['mongoose'] },
            transformers: { add: ['lodash'] },
            middleware: { add: ['express-rate-limit'] },
          },
        },
      });

      expect(result).toStrictEqual(expectedConfig);
    });
  });

  describe('edge cases', () => {
    it('EDGE: multiple configs with undefined schema => last undefined preserved', () => {
      const config1 = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
      });

      const config2 = QuestmaestroConfigStub({
        framework: 'react',
        schema: ['zod'],
      });

      const result = mergeConfigsTransformer({
        configs: [config1, config2],
      });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: ['zod'],
      });
    });

    it('EDGE: architecture with empty overrides object => preserves empty object', () => {
      const baseConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {},
        },
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['material-ui'] },
          },
        },
      });

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual(packageConfig);
    });

    it('EDGE: package config overwrites undefined routing with undefined => undefined preserved', () => {
      const baseConfig = QuestmaestroConfigStub({
        framework: 'node-library',
        schema: 'zod',
      });

      const packageConfig = QuestmaestroConfigStub({
        framework: 'node-library',
        schema: 'zod',
      });

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'node-library',
        schema: 'zod',
      });
    });
  });
});
