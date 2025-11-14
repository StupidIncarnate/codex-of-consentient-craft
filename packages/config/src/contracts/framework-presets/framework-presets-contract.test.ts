import { frameworkPresetsContract } from './framework-presets-contract';
import { FRAMEWORK_PRESETS, FrameworkPresetStub } from './framework-presets.stub';
import { frameworkStatics } from '../../statics/framework/framework-statics';

describe('frameworkPresetsContract', () => {
  describe('valid framework preset', () => {
    it('VALID: stub default => parses successfully', () => {
      const preset = FrameworkPresetStub();

      const result = frameworkPresetsContract.parse(preset);

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

    it('VALID: stub with widgets override => parses with custom widgets', () => {
      const preset = FrameworkPresetStub({
        widgets: ['vue'],
      });

      const result = frameworkPresetsContract.parse(preset);

      expect(result.widgets).toStrictEqual(['vue']);
    });

    it('VALID: stub with null widgets => parses with null value', () => {
      const preset = FrameworkPresetStub({
        widgets: null,
      });

      const result = frameworkPresetsContract.parse(preset);

      expect(result.widgets).toBeNull();
    });
  });

  describe('invalid framework preset', () => {
    it('INVALID_STRUCTURE: missing required properties => throws validation error', () => {
      expect(() => {
        return frameworkPresetsContract.parse({
          widgets: [],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_TYPE: widgets not array or null => throws validation error', () => {
      expect(() => {
        return frameworkPresetsContract.parse({
          ...FrameworkPresetStub(),
          widgets: 'invalid',
        });
      }).toThrow(/Expected/u);
    });

    it('INVALID_TYPE: adapters not array => throws validation error', () => {
      expect(() => {
        return frameworkPresetsContract.parse({
          ...FrameworkPresetStub(),
          adapters: null,
        });
      }).toThrow(/Expected/u);
    });
  });
});

describe('FRAMEWORK_PRESETS', () => {
  describe('complete framework coverage', () => {
    it('VALID: contains preset for every framework => has all frameworks', () => {
      const allFrameworks = frameworkStatics.frameworks.all;
      const presetFrameworks = Object.keys(FRAMEWORK_PRESETS);

      expect(presetFrameworks.sort()).toStrictEqual(allFrameworks.slice().sort());
    });

    it('VALID: has correct number of presets => matches framework count', () => {
      const allFrameworks = frameworkStatics.frameworks.all;

      expect(Object.keys(FRAMEWORK_PRESETS)).toHaveLength(allFrameworks.length);
    });
  });

  describe('frontend framework presets', () => {
    it('VALID: React preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.react;

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

    it('VALID: Vue preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.vue;

      expect(preset).toStrictEqual({
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

    it('VALID: Angular preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.angular;

      expect(preset).toStrictEqual({
        widgets: ['@angular/core', '@angular/common'],
        bindings: ['@angular/core', '@angular/common'],
        state: ['@angular/core', '@angular/common'],
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

    it('VALID: Svelte preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.svelte;

      expect(preset).toStrictEqual({
        widgets: ['svelte'],
        bindings: ['svelte'],
        state: ['svelte'],
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

    it('VALID: Solid preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.solid;

      expect(preset).toStrictEqual({
        widgets: ['solid-js'],
        bindings: ['solid-js'],
        state: ['solid-js'],
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

    it('VALID: Preact preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.preact;

      expect(preset).toStrictEqual({
        widgets: ['preact'],
        bindings: ['preact'],
        state: ['preact'],
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

  describe('backend framework presets', () => {
    it('VALID: Express preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.express;

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

    it('VALID: Fastify preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.fastify;

      expect(preset).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['fastify'],
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

    it('VALID: Koa preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.koa;

      expect(preset).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['koa', '@koa/router'],
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

    it('VALID: Hapi preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.hapi;

      expect(preset).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['@hapi/hapi'],
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

    it('VALID: NestJS preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.nestjs;

      expect(preset).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['@nestjs/core', '@nestjs/common'],
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

  describe('fullstack framework presets', () => {
    it('VALID: Next.js preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.nextjs;

      expect(preset).toStrictEqual({
        widgets: ['react', 'react-dom', 'next'],
        bindings: ['react', 'react-dom', 'next'],
        state: ['react', 'react-dom', 'next'],
        flows: ['next'],
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

    it('VALID: Nuxt.js preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.nuxtjs;

      expect(preset).toStrictEqual({
        widgets: ['vue', 'nuxt'],
        bindings: ['vue', 'nuxt'],
        state: ['vue', 'nuxt'],
        flows: ['nuxt'],
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

    it('VALID: Remix preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.remix;

      expect(preset).toStrictEqual({
        widgets: ['react', 'react-dom', '@remix-run/react'],
        bindings: ['react', 'react-dom', '@remix-run/react'],
        state: ['react', 'react-dom', '@remix-run/react'],
        flows: ['@remix-run/react'],
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

  describe('library presets', () => {
    it('VALID: Node library preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS['node-library'];

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

    it('VALID: React library preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS['react-library'];

      expect(preset).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
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

  describe('CLI presets', () => {
    it('VALID: CLI preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.cli;

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

    it('VALID: Ink CLI preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS['ink-cli'];

      expect(preset).toStrictEqual({
        widgets: ['ink', 'react'],
        bindings: ['ink', 'react'],
        state: ['ink', 'react'],
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

  describe('monorepo preset', () => {
    it('VALID: Monorepo preset => has correct structure', () => {
      const preset = FRAMEWORK_PRESETS.monorepo;

      expect(preset).toStrictEqual({
        widgets: null,
        bindings: null,
        state: null,
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

  describe('preset structure validation', () => {
    it('VALID: React preset has wildcard adapters and startup => correct arrays', () => {
      const reactPreset = FRAMEWORK_PRESETS.react;

      expect(reactPreset).toStrictEqual({
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

    it('VALID: Express backend has no UI and wildcard arrays => correct structure', () => {
      const expressPreset = FRAMEWORK_PRESETS.express;

      expect(expressPreset).toStrictEqual({
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

    it('VALID: all presets exist for all frameworks => complete coverage', () => {
      const allFrameworks = frameworkStatics.frameworks.all;

      expect(Object.keys(FRAMEWORK_PRESETS).sort()).toStrictEqual(allFrameworks.slice().sort());
    });
  });
});
