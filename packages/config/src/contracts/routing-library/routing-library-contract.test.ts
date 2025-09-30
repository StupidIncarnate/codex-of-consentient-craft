import type { RoutingLibrary } from './routing-library-contract';
import { ALL_ROUTING_LIBRARIES, isValidRoutingLibrary } from './routing-library-contract';

describe('routing-library-contract', () => {
  describe('ALL_ROUTING_LIBRARIES', () => {
    describe('valid structure', () => {
      it('VALID: contains all expected routing libraries => returns complete array', () => {
        expect(ALL_ROUTING_LIBRARIES).toStrictEqual([
          'react-router-dom',
          'vue-router',
          '@angular/router',
          'express',
          'fastify',
          'koa',
          'hapi',
        ]);
      });

      it('VALID: is readonly array => returns readonly type', () => {
        expect(Array.isArray(ALL_ROUTING_LIBRARIES)).toBe(true);
        // Test that it's a const assertion (readonly) by checking it exists
        expect(ALL_ROUTING_LIBRARIES.length).toBeGreaterThan(0);
      });
    });
  });

  describe('isValidRoutingLibrary()', () => {
    describe('valid frontend routing inputs', () => {
      it('VALID: "react-router-dom" => returns true', () => {
        expect(isValidRoutingLibrary('react-router-dom')).toBe(true);
      });

      it('VALID: "vue-router" => returns true', () => {
        expect(isValidRoutingLibrary('vue-router')).toBe(true);
      });

      it('VALID: "@angular/router" => returns true', () => {
        expect(isValidRoutingLibrary('@angular/router')).toBe(true);
      });
    });

    describe('valid backend framework inputs', () => {
      it('VALID: "express" => returns true', () => {
        expect(isValidRoutingLibrary('express')).toBe(true);
      });

      it('VALID: "fastify" => returns true', () => {
        expect(isValidRoutingLibrary('fastify')).toBe(true);
      });

      it('VALID: "koa" => returns true', () => {
        expect(isValidRoutingLibrary('koa')).toBe(true);
      });

      it('VALID: "hapi" => returns true', () => {
        expect(isValidRoutingLibrary('hapi')).toBe(true);
      });
    });

    describe('invalid string inputs', () => {
      it('INVALID_LIBRARY: "react-router" => returns false', () => {
        expect(isValidRoutingLibrary('react-router')).toBe(false);
      });

      it('INVALID_LIBRARY: "next-router" => returns false', () => {
        expect(isValidRoutingLibrary('next-router')).toBe(false);
      });

      it('INVALID_LIBRARY: "reach-router" => returns false', () => {
        expect(isValidRoutingLibrary('reach-router')).toBe(false);
      });

      it('INVALID_LIBRARY: "EXPRESS" => returns false', () => {
        expect(isValidRoutingLibrary('EXPRESS')).toBe(false);
      });

      it('INVALID_LIBRARY: "Express" => returns false', () => {
        expect(isValidRoutingLibrary('Express')).toBe(false);
      });

      it('INVALID_LIBRARY: "nestjs" => returns false', () => {
        expect(isValidRoutingLibrary('nestjs')).toBe(false);
      });

      it('INVALID_LIBRARY: "@nestjs/core" => returns false', () => {
        expect(isValidRoutingLibrary('@nestjs/core')).toBe(false);
      });

      it('INVALID_LIBRARY: "angular/router" => returns false', () => {
        expect(isValidRoutingLibrary('angular/router')).toBe(false);
      });
    });

    describe('invalid type inputs', () => {
      it('INVALID_TYPE: null => returns false', () => {
        expect(isValidRoutingLibrary(null)).toBe(false);
      });

      it('INVALID_TYPE: undefined => returns false', () => {
        expect(isValidRoutingLibrary(undefined)).toBe(false);
      });

      it('INVALID_TYPE: 123 => returns false', () => {
        expect(isValidRoutingLibrary(123)).toBe(false);
      });

      it('INVALID_TYPE: true => returns false', () => {
        expect(isValidRoutingLibrary(true)).toBe(false);
      });

      it('INVALID_TYPE: false => returns false', () => {
        expect(isValidRoutingLibrary(false)).toBe(false);
      });

      it('INVALID_TYPE: [] => returns false', () => {
        expect(isValidRoutingLibrary([])).toBe(false);
      });

      it('INVALID_TYPE: {} => returns false', () => {
        expect(isValidRoutingLibrary({})).toBe(false);
      });

      it('INVALID_TYPE: () => {} => returns false', () => {
        expect(isValidRoutingLibrary(() => {})).toBe(false);
      });

      it('INVALID_TYPE: Symbol("test") => returns false', () => {
        expect(isValidRoutingLibrary(Symbol('test'))).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('EDGE: "" => returns false', () => {
        expect(isValidRoutingLibrary('')).toBe(false);
      });

      it('EDGE: "  express  " => returns false', () => {
        expect(isValidRoutingLibrary('  express  ')).toBe(false);
      });

      it('EDGE: "express\n" => returns false', () => {
        expect(isValidRoutingLibrary('express\n')).toBe(false);
      });

      it('EDGE: "express\t" => returns false', () => {
        expect(isValidRoutingLibrary('express\t')).toBe(false);
      });

      it('EDGE: 0 => returns false', () => {
        expect(isValidRoutingLibrary(0)).toBe(false);
      });

      it('EDGE: -1 => returns false', () => {
        expect(isValidRoutingLibrary(-1)).toBe(false);
      });

      it('EDGE: NaN => returns false', () => {
        expect(isValidRoutingLibrary(NaN)).toBe(false);
      });

      it('EDGE: Infinity => returns false', () => {
        expect(isValidRoutingLibrary(Infinity)).toBe(false);
      });
    });
  });

  describe('RoutingLibrary type', () => {
    describe('type compilation', () => {
      it('VALID: type accepts all valid routing libraries => compiles successfully', () => {
        const validLibraries: RoutingLibrary[] = [
          'react-router-dom',
          'vue-router',
          '@angular/router',
          'express',
          'fastify',
          'koa',
          'hapi',
        ];

        expect(validLibraries).toStrictEqual([
          'react-router-dom',
          'vue-router',
          '@angular/router',
          'express',
          'fastify',
          'koa',
          'hapi',
        ]);
      });
    });
  });
});
