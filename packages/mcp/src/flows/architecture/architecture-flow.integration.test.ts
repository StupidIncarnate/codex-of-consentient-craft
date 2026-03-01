import { ArchitectureFlow } from './architecture-flow';

describe('ArchitectureFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 5 registrations with correct tool names', () => {
      const registrations = ArchitectureFlow();

      const names = registrations.map(({ name }) => name);

      expect(registrations).toHaveLength(5);
      expect(names).toStrictEqual([
        'discover',
        'get-architecture',
        'get-folder-detail',
        'get-syntax-rules',
        'get-testing-patterns',
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
      ]);
    });

    it('VALID: each registration has an inputSchema object', () => {
      const registrations = ArchitectureFlow();

      const schemaTypes = registrations.map(({ inputSchema }) => typeof inputSchema);

      expect(schemaTypes).toStrictEqual(['object', 'object', 'object', 'object', 'object']);
    });
  });
});
