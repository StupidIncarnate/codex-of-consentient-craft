import { applyOverridesTransformer } from './apply-overrides-transformer';
import type { FrameworkPreset } from '../../contracts/framework-presets/framework-presets';
import type { QuestmaestroConfig } from '../../contracts/questmaestro-config/questmaestro-config-contract';

describe('applyOverridesTransformer', () => {
  describe('config without overrides', () => {
    it('VALID: config without architecture => returns original preset', () => {
      const preset: FrameworkPreset = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: config with architecture but no overrides => returns original preset', () => {
      const preset: FrameworkPreset = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          allowedRootFiles: ['custom.d.ts'],
          booleanFunctionPrefixes: ['check'],
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: config with empty overrides object => returns original preset', () => {
      const preset: FrameworkPreset = {
        widgets: ['vue'],
        bindings: ['vue'],
        state: ['vue'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'vue',
        schema: 'yup',
        architecture: {
          overrides: {},
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['vue'],
        bindings: ['vue'],
        state: ['vue'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });
  });

  describe('single folder override', () => {
    it('VALID: widgets override with add => adds packages to widgets array', () => {
      const preset: FrameworkPreset = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['styled-components', 'material-ui'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom', 'styled-components', 'material-ui'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: bindings override with add => adds packages to bindings array', () => {
      const preset: FrameworkPreset = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            bindings: { add: ['react-query', 'swr'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom', 'react-query', 'swr'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: state override with add => adds packages to state array', () => {
      const preset: FrameworkPreset = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            state: { add: ['redux', 'zustand'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom', 'redux', 'zustand'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: flows override with add => adds packages to flows array', () => {
      const preset: FrameworkPreset = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: ['react-router-dom'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            flows: { add: ['@reach/router'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: ['react-router-dom', '@reach/router'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: responders override with add => adds packages to responders array', () => {
      const preset: FrameworkPreset = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            responders: { add: ['express', 'fastify'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: ['express', 'fastify'],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: contracts override with add => adds packages to contracts array', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'zod',
        architecture: {
          overrides: {
            contracts: { add: ['class-validator', 'joi'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: ['zod', 'class-validator', 'joi'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: brokers override with add => adds packages to brokers array', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'express',
        schema: 'zod',
        architecture: {
          overrides: {
            brokers: { add: ['mongoose', 'typeorm'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: ['mongoose', 'typeorm'],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: transformers override with add => adds packages to transformers array', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'express',
        schema: 'zod',
        architecture: {
          overrides: {
            transformers: { add: ['lodash', 'ramda'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: ['lodash', 'ramda'],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: errors override with add => adds packages to errors array', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'express',
        schema: 'zod',
        architecture: {
          overrides: {
            errors: { add: ['http-errors', 'boom'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: ['http-errors', 'boom'],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: middleware override with add => adds packages to middleware array', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'express',
        schema: 'zod',
        architecture: {
          overrides: {
            middleware: { add: ['helmet', 'cors'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: ['helmet', 'cors'],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: adapters override with add => adds packages to adapters array', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'express',
        schema: 'zod',
        architecture: {
          overrides: {
            adapters: { add: ['axios', 'node-fetch'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*', 'axios', 'node-fetch'],
        startup: ['*'],
      });
    });

    it('VALID: startup override with add => adds packages to startup array', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'express',
        schema: 'zod',
        architecture: {
          overrides: {
            startup: { add: ['dotenv', 'config'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*', 'dotenv', 'config'],
      });
    });
  });

  describe('multiple folder overrides', () => {
    it('VALID: multiple array folder overrides => all arrays get packages added', () => {
      const preset: FrameworkPreset = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['styled-components'] },
            state: { add: ['redux'] },
            contracts: { add: ['yup'] },
            brokers: { add: ['axios'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom', 'styled-components'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom', 'redux'],
        flows: [],
        responders: [],
        contracts: ['zod', 'yup'],
        brokers: ['axios'],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: all folder types with overrides => all get packages added', () => {
      const preset: FrameworkPreset = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: ['react-router-dom'],
        responders: [],
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['material-ui'] },
            bindings: { add: ['react-query'] },
            state: { add: ['zustand'] },
            flows: { add: ['@reach/router'] },
            responders: { add: ['express'] },
            contracts: { add: ['yup'] },
            brokers: { add: ['mongoose'] },
            transformers: { add: ['lodash'] },
            errors: { add: ['boom'] },
            middleware: { add: ['helmet'] },
            adapters: { add: ['axios'] },
            startup: { add: ['dotenv'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom', 'material-ui'],
        bindings: ['react', 'react-dom', 'react-query'],
        state: ['react', 'react-dom', 'zustand'],
        flows: ['react-router-dom', '@reach/router'],
        responders: ['express'],
        contracts: ['zod', 'yup'],
        brokers: ['mongoose'],
        transformers: ['lodash'],
        errors: ['boom'],
        middleware: ['helmet'],
        adapters: ['*', 'axios'],
        startup: ['*', 'dotenv'],
      });
    });
  });

  describe('null folder handling', () => {
    it('VALID: override on null widgets folder => no packages added, remains null', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['react'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: override on null bindings folder => no packages added, remains null', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'zod',
        architecture: {
          overrides: {
            bindings: { add: ['react-query'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: override on null flows folder => no packages added, remains null', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'zod',
        architecture: {
          overrides: {
            flows: { add: ['express'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: override on null responders folder => no packages added, remains null', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'zod',
        architecture: {
          overrides: {
            responders: { add: ['express'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: multiple null folder overrides => all remain null, array folders get packages', () => {
      const preset: FrameworkPreset = {
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['react'] },
            bindings: { add: ['react-query'] },
            flows: { add: ['express'] },
            responders: { add: ['fastify'] },
            state: { add: ['redis'] },
            contracts: { add: ['yup'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: ['redis'],
        flows: null,
        responders: null,
        contracts: ['yup'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: empty add array => no packages added to folder', () => {
      const preset: FrameworkPreset = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: [] },
            state: { add: [] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('EDGE: override without add property => no packages added', () => {
      const preset: FrameworkPreset = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: {},
            state: {},
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('EDGE: single package in add array => single package added correctly', () => {
      const preset: FrameworkPreset = {
        widgets: [],
        bindings: [],
        state: [],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: { add: ['single-package'] },
          },
        },
      };

      const result = applyOverridesTransformer({ preset, config });

      expect(result).toStrictEqual({
        widgets: ['single-package'],
        bindings: [],
        state: [],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });
  });
});
