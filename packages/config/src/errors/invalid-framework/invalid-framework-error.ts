export class InvalidFrameworkError extends Error {
  constructor({ framework }: { framework: unknown }) {
    const frameworkStr = typeof framework === 'string' ? framework : String(framework);
    super(
      `Invalid framework "${frameworkStr}". Must be one of: react, vue, angular, svelte, solid, preact, express, fastify, koa, hapi, nestjs, nextjs, nuxtjs, remix, node-library, react-library, cli, ink-cli, monorepo`,
    );
    this.name = 'InvalidFrameworkError';
  }
}
