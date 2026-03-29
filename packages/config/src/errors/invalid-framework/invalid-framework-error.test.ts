import { InvalidFrameworkError } from './invalid-framework-error';

describe('InvalidFrameworkError', () => {
  describe('constructor()', () => {
    it('VALID: {framework: "unknown"} => creates error with framework in message', () => {
      const error = new InvalidFrameworkError({ framework: 'unknown' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidFrameworkError',
        message:
          'Invalid framework "unknown". Must be one of: react, vue, angular, svelte, solid, preact, express, fastify, koa, hapi, nestjs, nextjs, nuxtjs, remix, node-library, react-library, cli, ink-cli, monorepo',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(InvalidFrameworkError);
    });

    it('VALID: {framework: 123} => converts number to string in message', () => {
      const error = new InvalidFrameworkError({ framework: 123 as unknown });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidFrameworkError',
        message:
          'Invalid framework "123". Must be one of: react, vue, angular, svelte, solid, preact, express, fastify, koa, hapi, nestjs, nextjs, nuxtjs, remix, node-library, react-library, cli, ink-cli, monorepo',
      });
    });

    it('VALID: {framework: null} => converts null to string in message', () => {
      const error = new InvalidFrameworkError({ framework: null as unknown });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidFrameworkError',
        message:
          'Invalid framework "null". Must be one of: react, vue, angular, svelte, solid, preact, express, fastify, koa, hapi, nestjs, nextjs, nuxtjs, remix, node-library, react-library, cli, ink-cli, monorepo',
      });
    });

    it('VALID: {framework: undefined} => converts undefined to string in message', () => {
      const error = new InvalidFrameworkError({ framework: undefined as unknown });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidFrameworkError',
        message:
          'Invalid framework "undefined". Must be one of: react, vue, angular, svelte, solid, preact, express, fastify, koa, hapi, nestjs, nextjs, nuxtjs, remix, node-library, react-library, cli, ink-cli, monorepo',
      });
    });

    it('VALID: {framework: {}} => converts object to string in message', () => {
      const error = new InvalidFrameworkError({ framework: {} as unknown });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidFrameworkError',
        message:
          'Invalid framework "[object Object]". Must be one of: react, vue, angular, svelte, solid, preact, express, fastify, koa, hapi, nestjs, nextjs, nuxtjs, remix, node-library, react-library, cli, ink-cli, monorepo',
      });
    });

    it('VALID: {framework: ""} => handles empty string', () => {
      const error = new InvalidFrameworkError({ framework: '' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidFrameworkError',
        message:
          'Invalid framework "". Must be one of: react, vue, angular, svelte, solid, preact, express, fastify, koa, hapi, nestjs, nextjs, nuxtjs, remix, node-library, react-library, cli, ink-cli, monorepo',
      });
    });
  });
});
