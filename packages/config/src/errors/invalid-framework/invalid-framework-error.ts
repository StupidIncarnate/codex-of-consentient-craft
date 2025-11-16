/**
 * PURPOSE: Represents an error when an invalid framework value is provided
 *
 * USAGE:
 * throw new InvalidFrameworkError({framework: 'unknown'});
 * // Throws error indicating invalid framework with list of valid options
 */
export class InvalidFrameworkError extends Error {
  public constructor({ framework }: { framework: unknown }) {
    const frameworkStr = typeof framework === 'string' ? framework : String(framework);
    super(
      `Invalid framework "${frameworkStr}". Must be one of: react, vue, angular, svelte, solid, preact, express, fastify, koa, hapi, nestjs, nextjs, nuxtjs, remix, node-library, react-library, cli, ink-cli, monorepo`,
    );
    this.name = 'InvalidFrameworkError';
  }
}
