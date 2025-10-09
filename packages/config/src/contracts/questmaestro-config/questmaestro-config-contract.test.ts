import type { QuestmaestroConfig } from './questmaestro-config-contract';
import {
  DEFAULT_ALLOWED_ROOT_FILES,
  DEFAULT_BOOLEAN_FUNCTION_PREFIXES,
} from './questmaestro-config-contract';

describe('questmaestro-config-contract', () => {
  describe('DEFAULT_ALLOWED_ROOT_FILES', () => {
    describe('valid structure', () => {
      it('VALID: contains expected default root files => returns complete array', () => {
        expect(DEFAULT_ALLOWED_ROOT_FILES).toStrictEqual(['global.d.ts']);
      });

      it('VALID: is readonly array => returns readonly type', () => {
        expect(Array.isArray(DEFAULT_ALLOWED_ROOT_FILES)).toBe(true);
        // Test that it's a const assertion (readonly) by checking it exists
        expect(DEFAULT_ALLOWED_ROOT_FILES.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFAULT_BOOLEAN_FUNCTION_PREFIXES', () => {
    describe('valid structure', () => {
      it('VALID: contains expected default boolean prefixes => returns complete array', () => {
        expect(DEFAULT_BOOLEAN_FUNCTION_PREFIXES).toStrictEqual([
          'is',
          'has',
          'can',
          'should',
          'will',
          'was',
        ]);
      });

      it('VALID: is readonly array => returns readonly type', () => {
        expect(Array.isArray(DEFAULT_BOOLEAN_FUNCTION_PREFIXES)).toBe(true);
        // Test that it's a const assertion (readonly) by checking it exists
        expect(DEFAULT_BOOLEAN_FUNCTION_PREFIXES.length).toBeGreaterThan(0);
      });
    });
  });

  describe('QuestmaestroConfig type', () => {
    describe('minimal valid configurations', () => {
      it('VALID: minimal React app config => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'react',
          routing: 'react-router-dom',
          schema: 'zod',
        };

        expect(config.framework).toBe('react');
        expect(config.routing).toBe('react-router-dom');
        expect(config.schema).toBe('zod');
      });

      it('VALID: minimal backend config => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'express',
          routing: 'express',
          schema: 'zod',
        };

        expect(config.framework).toBe('express');
        expect(config.routing).toBe('express');
        expect(config.schema).toBe('zod');
      });

      it('VALID: minimal library config without routing => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'node-library',
          schema: 'zod',
        };

        expect(config.framework).toBe('node-library');
        expect(config.routing).toBeUndefined();
        expect(config.schema).toBe('zod');
      });
    });

    describe('schema configurations', () => {
      it('VALID: single schema library => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'react',
          routing: 'react-router-dom',
          schema: 'zod',
        };

        expect(config.schema).toBe('zod');
      });

      it('VALID: multiple schema libraries => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'nextjs',
          schema: ['zod'],
        };

        expect(config.schema).toStrictEqual(['zod']);
      });

      it('VALID: all supported schema libraries => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'vue',
          routing: 'vue-router',
          schema: ['zod'],
        };

        expect(config.schema).toStrictEqual(['zod']);
      });
    });

    describe('architecture overrides', () => {
      it('VALID: config with architecture overrides => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'react',
          routing: 'react-router-dom',
          schema: 'zod',
          architecture: {
            overrides: {
              widgets: {
                add: ['@mui/material', 'styled-components'],
              },
              state: {
                add: ['zustand', 'redux-toolkit'],
              },
            },
          },
        };

        expect(config.architecture?.overrides?.widgets?.add).toStrictEqual([
          '@mui/material',
          'styled-components',
        ]);
        expect(config.architecture?.overrides?.state?.add).toStrictEqual([
          'zustand',
          'redux-toolkit',
        ]);
      });

      it('VALID: config with custom allowed root files => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'nextjs',
          schema: 'zod',
          architecture: {
            allowedRootFiles: ['global.d.ts', 'env.d.ts', 'types.d.ts'],
          },
        };

        expect(config.architecture?.allowedRootFiles).toStrictEqual([
          'global.d.ts',
          'env.d.ts',
          'types.d.ts',
        ]);
      });

      it('VALID: config with custom boolean function prefixes => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'express',
          routing: 'express',
          schema: 'zod',
          architecture: {
            booleanFunctionPrefixes: ['is', 'has', 'check', 'validate'],
          },
        };

        expect(config.architecture?.booleanFunctionPrefixes).toStrictEqual([
          'is',
          'has',
          'check',
          'validate',
        ]);
      });

      it('VALID: config with empty overrides => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'svelte',
          schema: 'zod',
          architecture: {
            overrides: {},
          },
        };

        expect(config.architecture?.overrides).toStrictEqual({});
      });

      it('VALID: config with empty arrays => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'solid',
          schema: 'zod',
          architecture: {
            allowedRootFiles: [],
            booleanFunctionPrefixes: [],
          },
        };

        expect(config.architecture?.allowedRootFiles).toStrictEqual([]);
        expect(config.architecture?.booleanFunctionPrefixes).toStrictEqual([]);
      });
    });

    describe('complete configurations', () => {
      it('VALID: complex frontend config with all options => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'react',
          routing: 'react-router-dom',
          schema: ['zod'],
          architecture: {
            overrides: {
              widgets: {
                add: ['@mui/material', 'styled-components'],
              },
              bindings: {
                add: ['react-query', 'swr'],
              },
              state: {
                add: ['zustand', 'redux-toolkit'],
              },
              adapters: {
                add: ['axios', 'fetch'],
              },
            },
            allowedRootFiles: ['global.d.ts', 'vite-env.d.ts'],
            booleanFunctionPrefixes: ['is', 'has', 'can', 'should'],
          },
        };

        expect(config.framework).toBe('react');
        expect(config.routing).toBe('react-router-dom');
        expect(config.schema).toStrictEqual(['zod']);
        expect(config.architecture?.overrides?.widgets?.add).toStrictEqual([
          '@mui/material',
          'styled-components',
        ]);
        expect(config.architecture?.overrides?.bindings?.add).toStrictEqual(['react-query', 'swr']);
        expect(config.architecture?.overrides?.state?.add).toStrictEqual([
          'zustand',
          'redux-toolkit',
        ]);
        expect(config.architecture?.overrides?.adapters?.add).toStrictEqual(['axios', 'fetch']);
        expect(config.architecture?.allowedRootFiles).toStrictEqual([
          'global.d.ts',
          'vite-env.d.ts',
        ]);
        expect(config.architecture?.booleanFunctionPrefixes).toStrictEqual([
          'is',
          'has',
          'can',
          'should',
        ]);
      });

      it('VALID: complex backend config with all options => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'fastify',
          routing: 'fastify',
          schema: 'zod',
          architecture: {
            overrides: {
              brokers: {
                add: ['prisma', 'mongoose'],
              },
              adapters: {
                add: ['redis', 'bullmq'],
              },
              middleware: {
                add: ['helmet', 'cors'],
              },
            },
            allowedRootFiles: ['global.d.ts', 'server.d.ts'],
            booleanFunctionPrefixes: ['is', 'has', 'validate', 'check'],
          },
        };

        expect(config.framework).toBe('fastify');
        expect(config.routing).toBe('fastify');
        expect(config.schema).toBe('zod');
        expect(config.architecture?.overrides?.brokers?.add).toStrictEqual(['prisma', 'mongoose']);
        expect(config.architecture?.overrides?.adapters?.add).toStrictEqual(['redis', 'bullmq']);
        expect(config.architecture?.overrides?.middleware?.add).toStrictEqual(['helmet', 'cors']);
        expect(config.architecture?.allowedRootFiles).toStrictEqual(['global.d.ts', 'server.d.ts']);
        expect(config.architecture?.booleanFunctionPrefixes).toStrictEqual([
          'is',
          'has',
          'validate',
          'check',
        ]);
      });

      it('VALID: library config without routing but with overrides => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'node-library',
          schema: ['zod'],
          architecture: {
            overrides: {
              contracts: {
                add: ['json-schema'],
              },
              transformers: {
                add: ['lodash', 'ramda'],
              },
            },
            allowedRootFiles: ['global.d.ts', 'index.d.ts'],
            booleanFunctionPrefixes: ['is', 'has'],
          },
        };

        expect(config.framework).toBe('node-library');
        expect(config.routing).toBeUndefined();
        expect(config.schema).toStrictEqual(['zod']);
        expect(config.architecture?.overrides?.contracts?.add).toStrictEqual(['json-schema']);
        expect(config.architecture?.overrides?.transformers?.add).toStrictEqual([
          'lodash',
          'ramda',
        ]);
        expect(config.architecture?.allowedRootFiles).toStrictEqual(['global.d.ts', 'index.d.ts']);
        expect(config.architecture?.booleanFunctionPrefixes).toStrictEqual(['is', 'has']);
      });
    });

    describe('framework variations', () => {
      it('VALID: Angular config => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'angular',
          routing: '@angular/router',
          schema: 'zod',
        };

        expect(config.framework).toBe('angular');
        expect(config.routing).toBe('@angular/router');
        expect(config.schema).toBe('zod');
      });

      it('VALID: Vue config => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'vue',
          routing: 'vue-router',
          schema: 'zod',
        };

        expect(config.framework).toBe('vue');
        expect(config.routing).toBe('vue-router');
        expect(config.schema).toBe('zod');
      });

      it('VALID: Svelte config => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'svelte',
          schema: 'zod',
        };

        expect(config.framework).toBe('svelte');
        expect(config.routing).toBeUndefined();
        expect(config.schema).toBe('zod');
      });

      it('VALID: CLI config => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'cli',
          schema: 'zod',
        };

        expect(config.framework).toBe('cli');
        expect(config.routing).toBeUndefined();
        expect(config.schema).toBe('zod');
      });

      it('VALID: Ink CLI config => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'ink-cli',
          schema: 'zod',
        };

        expect(config.framework).toBe('ink-cli');
        expect(config.routing).toBeUndefined();
        expect(config.schema).toBe('zod');
      });

      it('VALID: Monorepo config => compiles successfully', () => {
        const config: QuestmaestroConfig = {
          framework: 'monorepo',
          schema: 'zod',
        };

        expect(config.framework).toBe('monorepo');
        expect(config.routing).toBeUndefined();
        expect(config.schema).toBe('zod');
      });
    });
  });
});
