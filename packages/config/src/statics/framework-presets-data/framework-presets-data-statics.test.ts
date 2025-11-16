import { frameworkPresetsDataStatics } from './framework-presets-data-statics';

describe('frameworkPresetsDataStatics', () => {
  describe('presets', () => {
    it('VALID: contains all expected framework keys', () => {
      const keys = Object.keys(frameworkPresetsDataStatics.presets);

      expect(keys).toStrictEqual([
        'react',
        'vue',
        'angular',
        'svelte',
        'solid',
        'preact',
        'express',
        'fastify',
        'koa',
        'hapi',
        'nestjs',
        'nextjs',
        'nuxtjs',
        'remix',
        'node-library',
        'react-library',
        'cli',
        'ink-cli',
        'monorepo',
      ]);
    });

    it('VALID: React preset has expected structure', () => {
      const preset = frameworkPresetsDataStatics.presets.react;

      expect(preset).toStrictEqual({
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

    it('VALID: Express preset has null UI folders', () => {
      const preset = frameworkPresetsDataStatics.presets.express;

      expect(preset).toStrictEqual({
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
      });
    });

    it('VALID: node-library preset has null flows and responders', () => {
      const preset = frameworkPresetsDataStatics.presets['node-library'];

      expect(preset).toStrictEqual({
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
  });
});
