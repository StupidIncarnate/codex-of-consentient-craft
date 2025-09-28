import { mergeConfigsTransformer } from './merge-configs-transformer';
import type { QuestmaestroConfig } from '../../contracts/questmaestro-config/questmaestro-config-contract';

describe('mergeConfigsTransformer', () => {
  describe('empty configs array', () => {
    it('EMPTY: {configs: []} => throws "Cannot merge empty configs array"', () => {
      expect(() => mergeConfigsTransformer({ configs: [] })).toThrow(
        'Cannot merge empty configs array',
      );
    });
  });

  describe('single config', () => {
    it('VALID: {configs: [singleConfig]} => returns same config', () => {
      const config: QuestmaestroConfig = {
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
      };

      const result = mergeConfigsTransformer({ configs: [config] });

      expect(result).toStrictEqual({
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
    });
  });

  describe('two configs merging', () => {
    it('VALID: monorepo + package config => framework from package wins', () => {
      const monorepoConfig: QuestmaestroConfig = {
        framework: 'monorepo',
        schema: 'zod',
        architecture: {
          overrides: {
            contracts: { add: ['class-validator'] },
          },
          allowedRootFiles: ['global.d.ts'],
          booleanFunctionPrefixes: ['is', 'has'],
        },
      };

      const packageConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'yup',
        routing: 'react-router-dom',
      };

      const result = mergeConfigsTransformer({
        configs: [monorepoConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: 'yup',
        routing: 'react-router-dom',
        architecture: {
          overrides: {
            contracts: { add: ['class-validator'] },
          },
          allowedRootFiles: ['global.d.ts'],
          booleanFunctionPrefixes: ['is', 'has'],
        },
      });
    });

    it('VALID: base + override config => package routing wins when present', () => {
      const baseConfig: QuestmaestroConfig = {
        framework: 'vue',
        schema: 'joi',
        routing: 'vue-router',
      };

      const packageConfig: QuestmaestroConfig = {
        framework: 'vue',
        schema: 'zod',
        routing: 'vue-router',
      };

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
      const baseConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        routing: 'react-router-dom',
      };

      const packageConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'yup',
      };

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: 'yup',
        routing: 'react-router-dom',
      });
    });

    it('VALID: base + package without schema => base schema preserved', () => {
      const baseConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        routing: 'react-router-dom',
      };

      const packageConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: ['zod', 'yup'],
      };

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: ['zod', 'yup'],
        routing: 'react-router-dom',
      });
    });
  });

  describe('architecture merging', () => {
    it('VALID: base without architecture + package with architecture => package architecture added', () => {
      const baseConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
      };

      const packageConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['material-ui'] },
          },
          allowedRootFiles: ['types.d.ts'],
          booleanFunctionPrefixes: ['validate'],
        },
      };

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
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
    });

    it('VALID: base with architecture + package without architecture => base architecture preserved', () => {
      const baseConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            contracts: { add: ['class-validator'] },
          },
          allowedRootFiles: ['global.d.ts'],
          booleanFunctionPrefixes: ['is'],
        },
      };

      const packageConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
      };

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
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
    });

    it('VALID: both configs with architecture => package settings win, overrides merge', () => {
      const baseConfig: QuestmaestroConfig = {
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
      };

      const packageConfig: QuestmaestroConfig = {
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
      };

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
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
    });

    it('VALID: base with overrides + package without overrides => base overrides preserved', () => {
      const baseConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['styled-components'] },
          },
        },
      };

      const packageConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          allowedRootFiles: ['types.d.ts'],
        },
      };

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['styled-components'] },
          },
          allowedRootFiles: ['types.d.ts'],
        },
      });
    });

    it('VALID: base without overrides + package with overrides => package overrides added', () => {
      const baseConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          allowedRootFiles: ['global.d.ts'],
        },
      };

      const packageConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            state: { add: ['zustand'] },
          },
        },
      };

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            state: { add: ['zustand'] },
          },
          allowedRootFiles: ['global.d.ts'],
        },
      });
    });
  });

  describe('three configs merging', () => {
    it('VALID: monorepo + workspace + package => final package settings win', () => {
      const monorepoConfig: QuestmaestroConfig = {
        framework: 'monorepo',
        schema: 'zod',
        architecture: {
          overrides: {
            contracts: { add: ['class-validator'] },
          },
          allowedRootFiles: ['global.d.ts'],
          booleanFunctionPrefixes: ['is'],
        },
      };

      const workspaceConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'yup',
        routing: 'react-router-dom',
        architecture: {
          overrides: {
            widgets: { add: ['react-bootstrap'] },
          },
          allowedRootFiles: ['workspace.d.ts'],
          booleanFunctionPrefixes: ['has', 'can'],
        },
      };

      const packageConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'joi',
        architecture: {
          overrides: {
            state: { add: ['redux'] },
          },
          booleanFunctionPrefixes: ['check'],
        },
      };

      const result = mergeConfigsTransformer({
        configs: [monorepoConfig, workspaceConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: 'joi',
        routing: 'react-router-dom',
        architecture: {
          overrides: {
            contracts: { add: ['class-validator'] },
            widgets: { add: ['react-bootstrap'] },
            state: { add: ['redux'] },
          },
          allowedRootFiles: ['workspace.d.ts'],
          booleanFunctionPrefixes: ['check'],
        },
      });
    });

    it('VALID: multiple configs with partial overrides => all overrides accumulate correctly', () => {
      const config1: QuestmaestroConfig = {
        framework: 'express',
        schema: 'zod',
        architecture: {
          overrides: {
            adapters: { add: ['axios'] },
            middleware: { add: ['helmet'] },
          },
        },
      };

      const config2: QuestmaestroConfig = {
        framework: 'express',
        schema: 'yup',
        architecture: {
          overrides: {
            brokers: { add: ['mongoose'] },
            middleware: { add: ['cors'] },
          },
        },
      };

      const config3: QuestmaestroConfig = {
        framework: 'express',
        schema: 'joi',
        architecture: {
          overrides: {
            transformers: { add: ['lodash'] },
            middleware: { add: ['express-rate-limit'] },
          },
        },
      };

      const result = mergeConfigsTransformer({
        configs: [config1, config2, config3],
      });

      expect(result).toStrictEqual({
        framework: 'express',
        schema: 'joi',
        architecture: {
          overrides: {
            adapters: { add: ['axios'] },
            brokers: { add: ['mongoose'] },
            transformers: { add: ['lodash'] },
            middleware: { add: ['express-rate-limit'] },
          },
        },
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: multiple configs with undefined schema => last undefined preserved', () => {
      const config1: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
      };

      const config2: QuestmaestroConfig = {
        framework: 'react',
        schema: ['yup', 'joi'],
      };

      const result = mergeConfigsTransformer({
        configs: [config1, config2],
      });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: ['yup', 'joi'],
      });
    });

    it('EDGE: configs with only framework defined => minimal merge', () => {
      const config1: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'zod',
      };

      const config2: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'yup',
      };

      const result = mergeConfigsTransformer({
        configs: [config1, config2],
      });

      expect(result).toStrictEqual({
        framework: 'node-library',
        schema: 'yup',
      });
    });

    it('EDGE: architecture with empty overrides object => preserves empty object', () => {
      const baseConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {},
        },
      };

      const packageConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['material-ui'] },
          },
        },
      };

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['material-ui'] },
          },
        },
      });
    });

    it('EDGE: package config overwrites undefined routing with undefined => undefined preserved', () => {
      const baseConfig: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'zod',
      };

      const packageConfig: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'yup',
      };

      const result = mergeConfigsTransformer({
        configs: [baseConfig, packageConfig],
      });

      expect(result).toStrictEqual({
        framework: 'node-library',
        schema: 'yup',
      });
    });
  });
});
