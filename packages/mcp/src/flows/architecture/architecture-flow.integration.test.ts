import { ArchitectureFlow } from './architecture-flow';

describe('ArchitectureFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 7 registrations with correct tool names', () => {
      const registrations = ArchitectureFlow();

      const names = registrations.map(({ name }) => name);

      expect(names).toStrictEqual([
        'discover',
        'get-architecture',
        'get-folder-detail',
        'get-syntax-rules',
        'get-testing-patterns',
        'get-project-map',
        'get-project-inventory',
      ]);
    });

    it('VALID: each registration has a handler function', () => {
      const registrations = ArchitectureFlow();

      const handlerTypes = registrations.map(({ handler }) => typeof handler);

      expect(handlerTypes).toStrictEqual([
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
      ]);
    });

    it('VALID: each registration has a non-empty description', () => {
      const registrations = ArchitectureFlow();

      const descriptions = registrations.map(({ description }) => description);

      expect(descriptions).toStrictEqual([
        'Discover utilities, brokers, and files across the codebase',
        'Returns complete architecture overview',
        'Returns detailed information about a specific folder type',
        'Returns universal syntax rules',
        'Returns testing patterns and philosophy for writing tests and proxies',
        'Returns a project-map slice for the requested packages: connection graphs, folder types, file counts. Pass one or more package names; required.',
        'Returns the per-package folder/file inventory section for a single package',
      ]);
    });

    it('VALID: each registration has an inputSchema object', () => {
      const registrations = ArchitectureFlow();

      const schemaTypes = registrations.map(({ inputSchema }) => typeof inputSchema);

      expect(schemaTypes).toStrictEqual([
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
      ]);
    });
  });
});
