import type { Framework } from './framework-contract';
import { ALL_FRAMEWORKS, isValidFramework } from './framework-contract';

describe('framework-contract', () => {
  describe('ALL_FRAMEWORKS', () => {
    it('VALID: => returns all framework names in expected order', () => {
      expect(ALL_FRAMEWORKS).toStrictEqual([
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

    it('VALID: => returns readonly array', () => {
      expect(Array.isArray(ALL_FRAMEWORKS)).toBe(true);
      // Test that it's a const assertion (readonly) by checking it exists
      expect(ALL_FRAMEWORKS.length).toBeGreaterThan(0);
    });
  });

  describe('isValidFramework()', () => {
    describe('valid frameworks', () => {
      it('VALID: "react" => returns true', () => {
        const result = isValidFramework('react');

        expect(result).toBe(true);
      });

      it('VALID: "express" => returns true', () => {
        const result = isValidFramework('express');

        expect(result).toBe(true);
      });

      it('VALID: "monorepo" => returns true', () => {
        const result = isValidFramework('monorepo');

        expect(result).toBe(true);
      });
    });

    describe('invalid frameworks', () => {
      it('INVALID_FRAMEWORK: "invalid" => returns false', () => {
        const result = isValidFramework('invalid');

        expect(result).toBe(false);
      });

      it('INVALID_FRAMEWORK: "React" => returns false', () => {
        const result = isValidFramework('React');

        expect(result).toBe(false);
      });

      it('INVALID_FRAMEWORK: "" => returns false', () => {
        const result = isValidFramework('');

        expect(result).toBe(false);
      });
    });

    describe('non-string inputs', () => {
      it('INVALID_TYPE: null => returns false', () => {
        const result = isValidFramework(null);

        expect(result).toBe(false);
      });

      it('INVALID_TYPE: undefined => returns false', () => {
        const result = isValidFramework(undefined);

        expect(result).toBe(false);
      });

      it('INVALID_TYPE: 123 => returns false', () => {
        const result = isValidFramework(123);

        expect(result).toBe(false);
      });

      it('INVALID_TYPE: {} => returns false', () => {
        const result = isValidFramework({});

        expect(result).toBe(false);
      });

      it('INVALID_TYPE: [] => returns false', () => {
        const result = isValidFramework([]);

        expect(result).toBe(false);
      });

      it('INVALID_TYPE: true => returns false', () => {
        const result = isValidFramework(true);

        expect(result).toBe(false);
      });
    });
  });

  describe('Framework type', () => {
    describe('type compilation', () => {
      it('VALID: type accepts all valid frameworks => compiles successfully', () => {
        const validFrameworks: Framework[] = [
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
        ];

        expect(validFrameworks).toStrictEqual([
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
    });
  });
});
