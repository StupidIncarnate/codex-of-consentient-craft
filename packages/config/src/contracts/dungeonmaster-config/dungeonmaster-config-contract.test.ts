import { dungeonmasterConfigContract } from './dungeonmaster-config-contract';
import { DungeonmasterConfigStub } from './dungeonmaster-config.stub';

describe('dungeonmaster-config-contract', () => {
  describe('minimal valid configurations', () => {
    it('VALID: minimal React app config => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'react',
        routing: 'react-router-dom',
      });

      expect(config.framework).toBe('react');
      expect(config.routing).toBe('react-router-dom');
    });

    it('VALID: minimal backend config => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'express',
        routing: 'express',
      });

      expect(config.framework).toBe('express');
      expect(config.routing).toBe('express');
    });

    it('VALID: minimal library config without routing => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'node-library',
      });

      expect(config.framework).toBe('node-library');
      expect(config.routing).toBeUndefined();
    });
  });

  describe('schema configurations', () => {
    it('VALID: single schema library => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'react',
        schema: 'zod',
      });

      expect(config.schema).toBe('zod');
    });

    it('VALID: array of schema libraries => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'nextjs',
        schema: ['zod'],
      });

      expect(config.schema).toStrictEqual(['zod']);
    });
  });

  describe('architecture configurations', () => {
    it('VALID: config with allowed root files => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'nextjs',
        architecture: {
          allowedRootFiles: ['global.d.ts', 'env.d.ts'],
        },
      });

      expect(config.architecture?.allowedRootFiles).toStrictEqual(['global.d.ts', 'env.d.ts']);
    });

    it('VALID: config with boolean function prefixes => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        architecture: {
          booleanFunctionPrefixes: ['is', 'has', 'check'],
        },
      });

      expect(config.architecture?.booleanFunctionPrefixes).toStrictEqual(['is', 'has', 'check']);
    });

    it('VALID: config with empty overrides => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        architecture: {
          overrides: {},
        },
      });

      expect(config.architecture?.overrides).toStrictEqual({});
    });

    it('VALID: config with empty arrays => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        architecture: {
          allowedRootFiles: [],
          booleanFunctionPrefixes: [],
        },
      });

      expect(config.architecture?.allowedRootFiles).toStrictEqual([]);
      expect(config.architecture?.booleanFunctionPrefixes).toStrictEqual([]);
    });
  });

  describe('complex configurations with overrides', () => {
    it('VALID: complex frontend config => parses successfully through contract', () => {
      // Use contract.parse directly to avoid TypeScript record type issues with branded keys
      const parsed = dungeonmasterConfigContract.parse({
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
      });

      expect(parsed.framework).toBe('react');
      expect(parsed.schema).toStrictEqual(['zod']);
    });

    it('VALID: complex backend config => parses successfully through contract', () => {
      const parsed = dungeonmasterConfigContract.parse({
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
      });

      expect(parsed.framework).toBe('fastify');
      expect(parsed.schema).toBe('zod');
    });

    it('VALID: library config with overrides => parses successfully through contract', () => {
      const parsed = dungeonmasterConfigContract.parse({
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
      });

      expect(parsed.framework).toBe('node-library');
      expect(parsed.routing).toBeUndefined();
    });
  });

  describe('framework variations', () => {
    it('VALID: Angular config => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'angular',
        routing: '@angular/router',
      });

      expect(config.framework).toBe('angular');
      expect(config.routing).toBe('@angular/router');
    });

    it('VALID: Vue config => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'vue',
        routing: 'vue-router',
      });

      expect(config.framework).toBe('vue');
      expect(config.routing).toBe('vue-router');
    });

    it('VALID: Svelte config without routing => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'svelte',
      });

      expect(config.framework).toBe('svelte');
      expect(config.routing).toBeUndefined();
    });

    it('VALID: CLI config without routing => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'cli',
      });

      expect(config.framework).toBe('cli');
      expect(config.routing).toBeUndefined();
    });

    it('VALID: Ink CLI config without routing => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'ink-cli',
      });

      expect(config.framework).toBe('ink-cli');
      expect(config.routing).toBeUndefined();
    });

    it('VALID: Monorepo config without routing => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'monorepo',
      });

      expect(config.framework).toBe('monorepo');
      expect(config.routing).toBeUndefined();
    });
  });

  describe('contract validation', () => {
    it('VALID: stub data parses through contract => validated successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'react',
      });

      const result = dungeonmasterConfigContract.parse(config);

      expect(result).toBeDefined();
    });
  });

  describe('orchestration configurations', () => {
    it('VALID: config without orchestration => parses successfully', () => {
      const config = DungeonmasterConfigStub({
        framework: 'react',
      });

      expect(config.orchestration).toBeUndefined();
    });

    it('VALID: config with orchestration slotCount and timeoutMs => parses successfully', () => {
      const parsed = dungeonmasterConfigContract.parse({
        framework: 'react',
        schema: 'zod',
        orchestration: {
          slotCount: 5,
          timeoutMs: 120000,
        },
      });

      expect(parsed.orchestration?.slotCount).toBe(5);
      expect(parsed.orchestration?.timeoutMs).toBe(120000);
    });

    it('VALID: config with orchestration defaults => applies default values', () => {
      const parsed = dungeonmasterConfigContract.parse({
        framework: 'react',
        schema: 'zod',
        orchestration: {},
      });

      expect(parsed.orchestration?.slotCount).toBe(3);
      expect(parsed.orchestration?.timeoutMs).toBe(900000);
    });

    it('VALID: config with minimum slotCount => parses successfully', () => {
      const parsed = dungeonmasterConfigContract.parse({
        framework: 'react',
        schema: 'zod',
        orchestration: {
          slotCount: 1,
        },
      });

      expect(parsed.orchestration?.slotCount).toBe(1);
    });

    it('VALID: config with maximum slotCount => parses successfully', () => {
      const parsed = dungeonmasterConfigContract.parse({
        framework: 'react',
        schema: 'zod',
        orchestration: {
          slotCount: 10,
        },
      });

      expect(parsed.orchestration?.slotCount).toBe(10);
    });

    it('VALID: config with minimum timeoutMs => parses successfully', () => {
      const parsed = dungeonmasterConfigContract.parse({
        framework: 'react',
        schema: 'zod',
        orchestration: {
          timeoutMs: 60000,
        },
      });

      expect(parsed.orchestration?.timeoutMs).toBe(60000);
    });

    it('INVALID: slotCount below minimum => throws validation error', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          framework: 'react',
          schema: 'zod',
          orchestration: {
            slotCount: 0,
          },
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: slotCount above maximum => throws validation error', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          framework: 'react',
          schema: 'zod',
          orchestration: {
            slotCount: 11,
          },
        });
      }).toThrow(/too_big/u);
    });

    it('INVALID: timeoutMs below minimum => throws validation error', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          framework: 'react',
          schema: 'zod',
          orchestration: {
            timeoutMs: 59999,
          },
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: non-integer slotCount => throws validation error', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          framework: 'react',
          schema: 'zod',
          orchestration: {
            slotCount: 2.5,
          },
        });
      }).toThrow(/invalid_type/u);
    });

    it('INVALID: non-integer timeoutMs => throws validation error', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          framework: 'react',
          schema: 'zod',
          orchestration: {
            timeoutMs: 100000.5,
          },
        });
      }).toThrow(/invalid_type/u);
    });
  });
});
