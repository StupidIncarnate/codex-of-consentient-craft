import type { FrameworkPreset } from './framework-presets';
import { FRAMEWORK_PRESETS } from './framework-presets';
import type { Framework } from '../framework/framework-contract';
import { ALL_FRAMEWORKS } from '../framework/framework-contract';

describe('framework-presets', () => {
  describe('FRAMEWORK_PRESETS', () => {
    describe('complete framework coverage', () => {
      it('VALID: contains preset for every framework => returns complete mapping', () => {
        const presetFrameworks = Object.keys(FRAMEWORK_PRESETS);

        expect(presetFrameworks.sort()).toStrictEqual(ALL_FRAMEWORKS.slice().sort());
      });

      it('VALID: has correct number of presets => returns expected count', () => {
        expect(Object.keys(FRAMEWORK_PRESETS)).toHaveLength(ALL_FRAMEWORKS.length);
      });
    });

    describe('frontend framework presets', () => {
      describe('React preset', () => {
        it('VALID: React preset => returns correct structure', () => {
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
      });

      describe('Vue preset', () => {
        it('VALID: Vue preset => returns correct structure', () => {
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
      });

      describe('Angular preset', () => {
        it('VALID: Angular preset => returns correct structure', () => {
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
      });

      describe('Svelte preset', () => {
        it('VALID: Svelte preset => returns correct structure', () => {
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
      });

      describe('Solid preset', () => {
        it('VALID: Solid preset => returns correct structure', () => {
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
      });

      describe('Preact preset', () => {
        it('VALID: Preact preset => returns correct structure', () => {
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
    });

    describe('backend framework presets', () => {
      describe('Express preset', () => {
        it('VALID: Express preset => returns correct structure', () => {
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
      });

      describe('Fastify preset', () => {
        it('VALID: Fastify preset => returns correct structure', () => {
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
      });

      describe('Koa preset', () => {
        it('VALID: Koa preset => returns correct structure', () => {
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
      });

      describe('Hapi preset', () => {
        it('VALID: Hapi preset => returns correct structure', () => {
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
      });

      describe('NestJS preset', () => {
        it('VALID: NestJS preset => returns correct structure', () => {
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
    });

    describe('fullstack framework presets', () => {
      describe('Next.js preset', () => {
        it('VALID: Next.js preset => returns correct structure', () => {
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
      });

      describe('Nuxt.js preset', () => {
        it('VALID: Nuxt.js preset => returns correct structure', () => {
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
      });

      describe('Remix preset', () => {
        it('VALID: Remix preset => returns correct structure', () => {
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
    });

    describe('library presets', () => {
      describe('Node library preset', () => {
        it('VALID: Node library preset => returns correct structure', () => {
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
      });

      describe('React library preset', () => {
        it('VALID: React library preset => returns correct structure', () => {
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
    });

    describe('CLI presets', () => {
      describe('CLI preset', () => {
        it('VALID: CLI preset => returns correct structure', () => {
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
      });

      describe('Ink CLI preset', () => {
        it('VALID: Ink CLI preset => returns correct structure', () => {
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
    });

    describe('monorepo preset', () => {
      describe('Monorepo preset', () => {
        it('VALID: Monorepo preset => returns correct structure', () => {
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
    });

    describe('preset structure validation', () => {
      it('VALID: all presets have correct property types => returns valid structures', () => {
        Object.entries(FRAMEWORK_PRESETS).forEach(([, preset]) => {
          // Widgets must be array or null
          expect(preset.widgets === null || Array.isArray(preset.widgets)).toBe(true);

          // Bindings must be array or null
          expect(preset.bindings === null || Array.isArray(preset.bindings)).toBe(true);

          // State must be array or null
          expect(preset.state === null || Array.isArray(preset.state)).toBe(true);

          // Flows must be array or null
          expect(preset.flows === null || Array.isArray(preset.flows)).toBe(true);

          // Responders must be array or null
          expect(preset.responders === null || Array.isArray(preset.responders)).toBe(true);

          // Contracts must always be array
          expect(Array.isArray(preset.contracts)).toBe(true);

          // Brokers must always be array
          expect(Array.isArray(preset.brokers)).toBe(true);

          // Transformers must always be array
          expect(Array.isArray(preset.transformers)).toBe(true);

          // Errors must always be array
          expect(Array.isArray(preset.errors)).toBe(true);

          // Middleware must always be array
          expect(Array.isArray(preset.middleware)).toBe(true);

          // Adapters must always be array
          expect(Array.isArray(preset.adapters)).toBe(true);

          // Startup must always be array
          expect(Array.isArray(preset.startup)).toBe(true);
        });
      });

      it('VALID: frontend frameworks have UI folders => returns array values', () => {
        const frontendFrameworks: Framework[] = [
          'react',
          'vue',
          'angular',
          'svelte',
          'solid',
          'preact',
        ];

        frontendFrameworks.forEach((framework) => {
          const preset = FRAMEWORK_PRESETS[framework];

          expect(Array.isArray(preset.widgets)).toBe(true);
          expect(Array.isArray(preset.bindings)).toBe(true);
          expect(Array.isArray(preset.state)).toBe(true);
          expect(preset.widgets!.length).toBeGreaterThan(0);
          expect(preset.bindings!.length).toBeGreaterThan(0);
          expect(preset.state!.length).toBeGreaterThan(0);
        });
      });

      it('VALID: backend frameworks have no UI folders => returns null values', () => {
        const backendFrameworks: Framework[] = ['express', 'fastify', 'koa', 'hapi', 'nestjs'];

        backendFrameworks.forEach((framework) => {
          const preset = FRAMEWORK_PRESETS[framework];

          expect(preset.widgets).toBeNull();
          expect(preset.bindings).toBeNull();
        });
      });

      it('VALID: fullstack frameworks have UI folders => returns array values', () => {
        const fullstackFrameworks: Framework[] = ['nextjs', 'nuxtjs', 'remix'];

        fullstackFrameworks.forEach((framework) => {
          const preset = FRAMEWORK_PRESETS[framework];

          expect(Array.isArray(preset.widgets)).toBe(true);
          expect(Array.isArray(preset.bindings)).toBe(true);
          expect(Array.isArray(preset.state)).toBe(true);
          expect(preset.widgets!.length).toBeGreaterThan(0);
          expect(preset.bindings!.length).toBeGreaterThan(0);
          expect(preset.state!.length).toBeGreaterThan(0);
        });
      });

      it('VALID: library frameworks have no flows/responders => returns null values', () => {
        const libraryFrameworks: Framework[] = ['node-library', 'react-library'];

        libraryFrameworks.forEach((framework) => {
          const preset = FRAMEWORK_PRESETS[framework];

          expect(preset.flows).toBeNull();
          expect(preset.responders).toBeNull();
        });
      });

      it('VALID: CLI frameworks have no flows/responders => returns null values', () => {
        const cliFrameworks: Framework[] = ['cli', 'ink-cli'];

        cliFrameworks.forEach((framework) => {
          const preset = FRAMEWORK_PRESETS[framework];

          expect(preset.flows).toBeNull();
          expect(preset.responders).toBeNull();
        });
      });

      it('VALID: all presets have wildcard adapters and startup => returns wildcard arrays', () => {
        Object.values(FRAMEWORK_PRESETS).forEach((preset) => {
          expect(preset.adapters).toStrictEqual(['*']);
          expect(preset.startup).toStrictEqual(['*']);
        });
      });
    });

    describe('edge cases', () => {
      it('EDGE: all presets have consistent structure => returns valid preset objects', () => {
        Object.values(FRAMEWORK_PRESETS).forEach((preset) => {
          // Test that all required properties exist
          expect(preset).toHaveProperty('widgets');
          expect(preset).toHaveProperty('bindings');
          expect(preset).toHaveProperty('state');
          expect(preset).toHaveProperty('flows');
          expect(preset).toHaveProperty('responders');
          expect(preset).toHaveProperty('contracts');
          expect(preset).toHaveProperty('brokers');
          expect(preset).toHaveProperty('transformers');
          expect(preset).toHaveProperty('errors');
          expect(preset).toHaveProperty('middleware');
          expect(preset).toHaveProperty('adapters');
          expect(preset).toHaveProperty('startup');
        });
      });
    });
  });

  describe('FrameworkPreset type', () => {
    describe('type compilation', () => {
      it('VALID: type accepts valid frontend preset structure => compiles successfully', () => {
        const preset: FrameworkPreset = {
          widgets: ['react'],
          bindings: ['react'],
          state: ['react'],
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

        expect(preset.widgets).toStrictEqual(['react']);
        expect(preset.bindings).toStrictEqual(['react']);
        expect(preset.state).toStrictEqual(['react']);
        expect(preset.flows).toStrictEqual(['react-router-dom']);
        expect(preset.responders).toStrictEqual([]);
        expect(preset.contracts).toStrictEqual(['zod']);
        expect(preset.brokers).toStrictEqual([]);
        expect(preset.transformers).toStrictEqual([]);
        expect(preset.errors).toStrictEqual([]);
        expect(preset.middleware).toStrictEqual([]);
        expect(preset.adapters).toStrictEqual(['*']);
        expect(preset.startup).toStrictEqual(['*']);
      });

      it('VALID: type accepts valid backend preset structure => compiles successfully', () => {
        const preset: FrameworkPreset = {
          widgets: null,
          bindings: null,
          state: [],
          flows: ['express'],
          responders: [],
          contracts: ['joi'],
          brokers: [],
          transformers: [],
          errors: [],
          middleware: [],
          adapters: ['*'],
          startup: ['*'],
        };

        expect(preset.widgets).toBeNull();
        expect(preset.bindings).toBeNull();
        expect(preset.state).toStrictEqual([]);
        expect(preset.flows).toStrictEqual(['express']);
        expect(preset.responders).toStrictEqual([]);
        expect(preset.contracts).toStrictEqual(['joi']);
        expect(preset.brokers).toStrictEqual([]);
        expect(preset.transformers).toStrictEqual([]);
        expect(preset.errors).toStrictEqual([]);
        expect(preset.middleware).toStrictEqual([]);
        expect(preset.adapters).toStrictEqual(['*']);
        expect(preset.startup).toStrictEqual(['*']);
      });

      it('VALID: type accepts valid library preset structure => compiles successfully', () => {
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

        expect(preset.widgets).toBeNull();
        expect(preset.bindings).toBeNull();
        expect(preset.state).toStrictEqual([]);
        expect(preset.flows).toBeNull();
        expect(preset.responders).toBeNull();
        expect(preset.contracts).toStrictEqual(['zod']);
        expect(preset.brokers).toStrictEqual([]);
        expect(preset.transformers).toStrictEqual([]);
        expect(preset.errors).toStrictEqual([]);
        expect(preset.middleware).toStrictEqual([]);
        expect(preset.adapters).toStrictEqual(['*']);
        expect(preset.startup).toStrictEqual(['*']);
      });
    });
  });
});
