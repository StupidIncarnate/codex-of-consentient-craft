import { WardFlow } from './ward-flow';

describe('WardFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 3 registrations with correct tool names', () => {
      const registrations = WardFlow();

      const names = registrations.map(({ name }) => name);

      expect(registrations).toHaveLength(3);
      expect(names).toStrictEqual(['ward-list', 'ward-detail', 'ward-raw']);
    });

    it('VALID: each registration has a handler function', () => {
      const registrations = WardFlow();

      const handlerTypes = registrations.map(({ handler }) => typeof handler);

      expect(handlerTypes).toStrictEqual(['function', 'function', 'function']);
    });

    it('VALID: each registration has a non-empty description', () => {
      const registrations = WardFlow();

      const descriptions = registrations.map(({ description }) => description);

      expect(descriptions).toStrictEqual([
        'List errors by file from a ward run. Supports per-package path via packagePath.',
        'Show detailed errors for a file in a ward run. Supports per-package path via packagePath.',
        'Show raw tool output from a ward run. Supports per-package path via packagePath.',
      ]);
    });

    it('VALID: each registration has an inputSchema object', () => {
      const registrations = WardFlow();

      const schemaTypes = registrations.map(({ inputSchema }) => typeof inputSchema);

      expect(schemaTypes).toStrictEqual(['object', 'object', 'object']);
    });
  });
});
